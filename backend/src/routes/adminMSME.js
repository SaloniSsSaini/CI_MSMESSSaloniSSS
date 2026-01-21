const express = require('express');
const router = express.Router();
const MSME = require('../models/MSME');
const User = require('../models/User');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const logger = require('../utils/logger');

// All routes require authentication and admin privileges
router.use(auth);
router.use(adminAuth);

// @route   GET /api/admin/msme/statistics
// @desc    Get admin dashboard statistics
// @access  Admin only
router.get('/statistics', async (req, res) => {
    try {
        const totalMSMEs = await MSME.countDocuments();
        const verifiedMSMEs = await MSME.countDocuments({ status: 'verified' });
        const flaggedMSMEs = await MSME.countDocuments({ status: 'flagged' });
        const pendingMSMEs = await MSME.countDocuments({ status: 'pending' });
        const suspendedMSMEs = await MSME.countDocuments({ status: 'suspended' });

        const totalUsers = await User.countDocuments();
        const msmeUsers = await User.countDocuments({ role: 'msme' });

        // Get recent registrations (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentRegistrations = await MSME.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        res.json({
            success: true,
            data: {
                msme: {
                    total: totalMSMEs,
                    verified: verifiedMSMEs,
                    flagged: flaggedMSMEs,
                    pending: pendingMSMEs,
                    suspended: suspendedMSMEs,
                    recentRegistrations
                },
                users: {
                    total: totalUsers,
                    msme: msmeUsers
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching admin statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// @route   GET /api/admin/msme/list
// @desc    Get list of all MSMEs with pagination and filtering
// @access  Admin only
router.get('/list', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Build filter query
        const filter = {};

        if (req.query.status) {
            filter.status = req.query.status;
        }

        if (req.query.industry) {
            filter.industry = req.query.industry;
        }

        if (req.query.search) {
            filter.$or = [
                { companyName: { $regex: req.query.search, $options: 'i' } },
                { gstNumber: { $regex: req.query.search, $options: 'i' } },
                { panNumber: { $regex: req.query.search, $options: 'i' } },
                { 'contact.email': { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // Get MSMEs with user information
        const msmes = await MSME.find(filter)
            .populate('userId', 'email profile createdAt lastLogin')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await MSME.countDocuments(filter);
        const pages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                msmes,
                pagination: {
                    total,
                    page,
                    pages,
                    limit
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching MSME list:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// @route   GET /api/admin/msme/:id
// @desc    Get detailed MSME information
// @access  Admin only
router.get('/:id', async (req, res) => {
    try {
        const msme = await MSME.findById(req.params.id)
            .populate('userId', 'email profile createdAt lastLogin isActive')
            .populate('adminNotes.addedBy', 'profile.firstName profile.lastName')
            .populate('flaggedBy', 'profile.firstName profile.lastName');

        if (!msme) {
            return res.status(404).json({
                success: false,
                message: 'MSME not found'
            });
        }

        res.json({
            success: true,
            data: { msme }
        });
    } catch (error) {
        logger.error('Error fetching MSME details:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// @route   PUT /api/admin/msme/:id/status
// @desc    Update MSME status (verify, flag, suspend)
// @access  Admin only
router.put('/:id/status', async (req, res) => {
    try {
        const { status, note } = req.body;

        // Validate status
        const validStatuses = ['pending', 'verified', 'flagged', 'suspended'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
        }

        const msme = await MSME.findById(req.params.id);

        if (!msme) {
            return res.status(404).json({
                success: false,
                message: 'MSME not found'
            });
        }

        // Update status
        msme.status = status;

        // If flagging, record who flagged and when
        if (status === 'flagged') {
            msme.flaggedAt = new Date();
            msme.flaggedBy = req.user.userId;
        }

        // Add admin note if provided
        if (note) {
            msme.adminNotes = msme.adminNotes || [];
            msme.adminNotes.push({
                note,
                addedBy: req.user.userId,
                addedAt: new Date()
            });
        }

        await msme.save();

        logger.info(`MSME ${msme.companyName} status updated to ${status} by admin ${req.user.email}`);

        res.json({
            success: true,
            message: `MSME status updated to ${status}`,
            data: { msme }
        });
    } catch (error) {
        logger.error('Error updating MSME status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// @route   DELETE /api/admin/msme/:id
// @desc    Delete MSME and optionally the associated user account
// @access  Admin only
router.delete('/:id', async (req, res) => {
    try {
        const { deleteUser } = req.query;  // ?deleteUser=true to also delete user account

        const msme = await MSME.findById(req.params.id);

        if (!msme) {
            return res.status(404).json({
                success: false,
                message: 'MSME not found'
            });
        }

        const userId = msme.userId;
        const companyName = msme.companyName;

        // Delete MSME
        await MSME.findByIdAndDelete(req.params.id);

        // Optionally delete user account
        if (deleteUser === 'true') {
            await User.findByIdAndDelete(userId);
            logger.info(`MSME ${companyName} and associated user account deleted by admin ${req.user.email}`);
        } else {
            logger.info(`MSME ${companyName} deleted by admin ${req.user.email}`);
        }

        res.json({
            success: true,
            message: `MSME deleted successfully${deleteUser === 'true' ? ' (including user account)' : ''}`
        });
    } catch (error) {
        logger.error('Error deleting MSME:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// @route   POST /api/admin/msme/:id/note
// @desc    Add admin note to MSME
// @access  Admin only
router.post('/:id/note', async (req, res) => {
    try {
        const { note } = req.body;

        if (!note || !note.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Note is required'
            });
        }

        const msme = await MSME.findById(req.params.id);

        if (!msme) {
            return res.status(404).json({
                success: false,
                message: 'MSME not found'
            });
        }

        msme.adminNotes = msme.adminNotes || [];
        msme.adminNotes.push({
            note: note.trim(),
            addedBy: req.user.userId,
            addedAt: new Date()
        });

        await msme.save();

        res.json({
            success: true,
            message: 'Note added successfully',
            data: { msme }
        });
    } catch (error) {
        logger.error('Error adding admin note:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

module.exports = router;
