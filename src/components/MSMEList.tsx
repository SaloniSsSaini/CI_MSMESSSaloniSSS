import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  Box,
  Alert,
  CircularProgress,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import ApiService from "../services/api";

interface MSMEData {
  _id: string;
  companyName: string;
  companyType: string;
  industry: string;
  businessDomain: string;
  establishmentYear: number;
  udyamRegistrationNumber: string;
  gstNumber: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  annualTurnover: number;
  numberOfEmployees: number;
  createdAt?: string;
}

const MSMEList: React.FC = () => {
  const navigate = useNavigate();
  const [msmeList, setMsmeList] = useState<MSMEData[]>([]);
  const [filteredList, setFilteredList] = useState<MSMEData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMSME, setSelectedMSME] = useState<MSMEData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch MSME list on component mount
  useEffect(() => {
    // fetchMSMEList();
  }, []);

  // Filter list based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredList(msmeList);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = msmeList.filter(
        (msme) =>
          msme.companyName.toLowerCase().includes(query) ||
          msme.email.toLowerCase().includes(query) ||
          msme.udyamRegistrationNumber.toLowerCase().includes(query) ||
          msme.gstNumber.toLowerCase().includes(query) ||
          msme.city.toLowerCase().includes(query) ||
          msme.state.toLowerCase().includes(query)
      );
      setFilteredList(filtered);
      setPage(0); // Reset to first page when searching
    }
  }, [searchQuery, msmeList]);

  // const fetchMSMEList = async () => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     const response = await ApiService.getMSMEList();
  //     if (response?.success && Array.isArray(response.data)) {
  //       setMsmeList(response.data);
  //       setFilteredList(response.data);
  //     } else {
  //       throw new Error("Failed to fetch MSME list");
  //     }
  //   } catch (err) {
  //     setError(
  //       err instanceof Error ? err.message : "Failed to load MSME list"
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleView = (msme: MSMEData) => {
    navigate(`/msme/${msme._id}`);
  };

  const handleEdit = (msme: MSMEData) => {
    navigate(`/msme/edit/${msme._id}`);
  };

  const handleDeleteClick = (msme: MSMEData) => {
    setSelectedMSME(msme);
    setDeleteDialogOpen(true);
  };

  // const handleDeleteConfirm = async () => {
  //   if (!selectedMSME) return;

  //   setIsDeleting(true);
  //   try {
  //     const response = await ApiService.deleteMSME(selectedMSME._id);
  //     if (response?.success) {
  //       // Remove deleted MSME from list
  //       setMsmeList((prev) => prev.filter((m) => m._id !== selectedMSME._id));
  //       setDeleteDialogOpen(false);
  //       setSelectedMSME(null);
  //     } else {
  //       throw new Error(response?.message || "Failed to delete MSME");
  //     }
  //   } catch (err) {
  //     setError(
  //       err instanceof Error ? err.message : "Failed to delete MSME"
  //     );
  //   } finally {
  //     setIsDeleting(false);
  //   }
  // };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedMSME(null);
  };

  const getCompanyTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "micro":
        return "info";
      case "small":
        return "success";
      case "medium":
        return "warning";
      default:
        return "default";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress color="success" size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          background: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <BusinessIcon sx={{ fontSize: 40, color: "white" }} />
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: 700, color: "white" }}
              >
                Registered MSMEs
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                {filteredList.length} companies registered
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={2}>
            <Tooltip title="Refresh">
              <IconButton
                // onClick={fetchMSMEList}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.3)",
                  },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/msme-registration")}
              sx={{
                backgroundColor: "white",
                color: "success.main",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.9)",
                },
              }}
            >
              Add New MSME
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by company name, email, UDYAM number, GST, city, or state..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Table */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 600 }}>Company Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Industry</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>UDYAM Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Turnover</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Employees</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchQuery
                        ? "No MSMEs found matching your search"
                        : "No MSMEs registered yet"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredList
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((msme) => (
                    <TableRow
                      key={msme._id}
                      hover
                      sx={{
                        "&:hover": {
                          backgroundColor: "rgba(76, 175, 80, 0.04)",
                        },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {msme.companyName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {msme.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={msme.companyType.toUpperCase()}
                          color={getCompanyTypeColor(msme.companyType)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {msme.industry}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {msme.businessDomain}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: "monospace",
                            fontSize: "0.75rem",
                          }}
                        >
                          {msme.udyamRegistrationNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {msme.city}, {msme.state}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(msme.annualTurnover)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {msme.numberOfEmployees}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="center"
                        >
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleView(msme)}
                              sx={{
                                color: "primary.main",
                                "&:hover": {
                                  backgroundColor: "rgba(33, 150, 243, 0.1)",
                                },
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(msme)}
                              sx={{
                                color: "warning.main",
                                "&:hover": {
                                  backgroundColor: "rgba(255, 152, 0, 0.1)",
                                },
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(msme)}
                              sx={{
                                color: "error.main",
                                "&:hover": {
                                  backgroundColor: "rgba(244, 67, 54, 0.1)",
                                },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {filteredList.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredList.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone!
          </Alert>
          <Typography variant="body1">
            Are you sure you want to delete{" "}
            <strong>{selectedMSME?.companyName}</strong>?
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              UDYAM: {selectedMSME?.udyamRegistrationNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email: {selectedMSME?.email}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleDeleteCancel}
            disabled={isDeleting}
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            // onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={isDeleting}
            startIcon={
              isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />
            }
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MSMEList;