import React, { useMemo, useState } from 'react';
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  Box,
  Switch,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Stack
} from '@mui/material';
import {
  MailOutline as MailIcon,
  Security as SecurityIcon,
  Bolt as BoltIcon,
  Assessment as AssessmentIcon,
  Lan as NetworkIcon,
  AccountBalance as BankIcon,
  EmojiEvents as IncentiveIcon
} from '@mui/icons-material';
import apiService from '../services/api';

interface EmailAssessmentResult {
  ingestedEmails: number;
  processedTransactions: number;
  skippedEmails: any[];
  failures: any[];
  transactions: Array<{
    messageId: string;
    subject: string;
    transactionType: string;
    amount: number;
    category: string;
    co2Emissions: number;
    confidence: number;
    processedAt: string;
  }>;
  carbonAssessment?: {
    totalCO2Emissions: number;
    breakdown: any;
    esgScopes: any;
    carbonScore: number;
    recommendations: any[];
  } | null;
  incentives: any[];
  greenLoanOffers: any[];
  metadata: {
    fetched: number;
    mailbox: string;
    sinceDays: number;
    connection: {
      host: string;
      port: number;
      secure: boolean;
    };
  };
}

const defaultFormState = {
  email: '',
  appPassword: '',
  imapServer: '',
  imapPort: '',
  secure: true,
  limit: 20,
  sinceDays: 60
};

const AICarbonEmailAgent: React.FC = () => {
  const [formState, setFormState] = useState(defaultFormState);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [result, setResult] = useState<EmailAssessmentResult | null>(null);

  const handleInputChange = (field: keyof typeof formState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'secure' ? (event.target as HTMLInputElement).checked : event.target.value;
    setFormState((prev) => ({
      ...prev,
      [field]: field === 'limit' || field === 'sinceDays' || field === 'imapPort'
        ? value === '' ? '' : Number(value)
        : value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!acknowledged) {
      setError('Please acknowledge the email data access disclaimer before proceeding.');
      return;
    }

    if (!formState.email || !formState.appPassword) {
      setError('Email address and application password are required.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload: any = {
        email: formState.email,
        appPassword: formState.appPassword,
        secure: formState.secure,
        limit: Number(formState.limit) || 20,
        sinceDays: Number(formState.sinceDays) || 60
      };

      if (formState.imapServer) {
        payload.imapServer = formState.imapServer;
      }
      if (formState.imapPort) {
        payload.imapPort = Number(formState.imapPort);
      }

      const response = await apiService.ingestEmailAssessment(payload);

      if (response?.success) {
        setResult(response.data as EmailAssessmentResult);
        setSuccessMessage(response.message || 'AI agents successfully analyzed your mailbox.');
      } else {
        setError(response?.message || 'Unable to complete email ingestion.');
      }
    } catch (submitError: any) {
      const message = submitError?.message || 'Failed to connect to mailbox. Verify credentials and IMAP access.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const carbonAssessment = result?.carbonAssessment || null;

  const scopeInsights = useMemo(() => {
    if (!carbonAssessment?.esgScopes) {
      return [];
    }

    return [
      {
        label: 'Scope 1 - Direct Emissions',
        value: carbonAssessment.esgScopes.scope1?.total || 0,
        color: 'error'
      },
      {
        label: 'Scope 2 - Purchased Energy',
        value: carbonAssessment.esgScopes.scope2?.total || 0,
        color: 'warning'
      },
      {
        label: 'Scope 3 - Value Chain',
        value: carbonAssessment.esgScopes.scope3?.total || 0,
        color: 'info'
      }
    ];
  }, [carbonAssessment]);

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <MailIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" component="h1">
            AI Email Carbon Intelligence
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Deep-tech agents connect to your MSME mailbox, extract sustainability signals, and compute Scope 1, 2, and 3 emissions automatically.
          </Typography>
        </Box>
      </Box>

      <Alert severity="warning" icon={<SecurityIcon fontSize="inherit" />} sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Email Data Access Disclaimer
        </Typography>
        <Typography variant="body2">
          By enabling AI email ingestion you grant Carbon Intelligence limited read access to business emails for sustainability analytics. Only carbon-relevant data is processed, encrypted in transit, and governed by the platform&apos;s data privacy policy. Provide an application-specific password (e.g. Gmail App Password) rather than your master account password.
        </Typography>
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Email Address"
              value={formState.email}
              onChange={handleInputChange('email')}
              fullWidth
              required
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="App Password / IMAP Token"
              type="password"
              value={formState.appPassword}
              onChange={handleInputChange('appPassword')}
              fullWidth
              required
              disabled={loading}
              helperText="Use an application password generated from your email provider."
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="IMAP Server (optional)"
              value={formState.imapServer}
              onChange={handleInputChange('imapServer')}
              fullWidth
              disabled={loading}
              placeholder="e.g. imap.gmail.com"
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              label="IMAP Port"
              type="number"
              value={formState.imapPort}
              onChange={handleInputChange('imapPort')}
              fullWidth
              disabled={loading}
              placeholder="993"
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControlLabel
              control={(
                <Switch
                  checked={formState.secure}
                  onChange={handleInputChange('secure')}
                  disabled={loading}
                />
              )}
              label="Use SSL/TLS"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Emails to Analyze"
              type="number"
              value={formState.limit}
              onChange={handleInputChange('limit')}
              fullWidth
              disabled={loading}
              helperText="Maximum messages to scan (1-100)"
              inputProps={{ min: 1, max: 100 }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Lookback Window (days)"
              type="number"
              value={formState.sinceDays}
              onChange={handleInputChange('sinceDays')}
              fullWidth
              disabled={loading}
              helperText="Only emails newer than this window are ingested"
              inputProps={{ min: 1, max: 365 }}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={(
                <Checkbox
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                  disabled={loading}
                />
              )}
              label="I authorize Carbon Intelligence to read the specified mailbox for sustainability analytics and acknowledge the secure handling of extracted data."
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <BoltIcon />}
              disabled={loading || !acknowledged}
            >
              {loading ? 'Analyzing mailbox…' : 'Run AI Email Assessment'}
            </Button>
          </Grid>
        </Grid>
      </form>

      {result && (
        <Box sx={{ mt: 5 }}>
          <Divider sx={{ mb: 4 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" gutterBottom>
                    Mailbox Summary
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <NetworkIcon color="primary" />
                    <Typography variant="subtitle1">
                      {result.metadata.connection.host}:{result.metadata.connection.port}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Emails scanned: <strong>{result.ingestedEmails}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Processed transactions: <strong>{result.processedTransactions}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lookback window: <strong>{result.metadata.sinceDays} days</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" gutterBottom>
                    Carbon Score
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <AssessmentIcon color="success" />
                    <Typography variant="h3" color="primary">
                      {carbonAssessment?.carbonScore ?? '—'}
                    </Typography>
                    {carbonAssessment && (
                      <Chip
                        label={carbonAssessment.carbonScore >= 80 ? 'Excellent' : carbonAssessment.carbonScore >= 60 ? 'On Track' : 'Needs Action'}
                        color={carbonAssessment.carbonScore >= 80 ? 'success' : carbonAssessment.carbonScore >= 60 ? 'warning' : 'error'}
                      />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Total emissions identified: {carbonAssessment ? `${carbonAssessment.totalCO2Emissions.toFixed(2)} kg CO₂e` : '—'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" gutterBottom>
                    Recommendation Insights
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <BoltIcon color="warning" />
                    <Typography variant="h5">
                      {carbonAssessment?.recommendations?.length || 0} actions
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    AI agents have prepared tailored emission reduction initiatives based on your recent activities.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {scopeInsights.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                ESG Scope Breakdown
              </Typography>
              <Grid container spacing={3}>
                {scopeInsights.map((scope) => (
                  <Grid item xs={12} md={4} key={scope.label}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color={`text.${scope.color === 'error' ? 'primary' : 'secondary'}`} gutterBottom>
                          {scope.label}
                        </Typography>
                        <Typography variant="h5">
                          {scope.value.toFixed(2)} kg CO₂e
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              AI Incentives & Climate Rewards
            </Typography>
            <Grid container spacing={2}>
              {result.incentives.map((incentive) => (
                <Grid item xs={12} md={6} key={incentive.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <IncentiveIcon color="success" />
                        <Typography variant="subtitle1">{incentive.title}</Typography>
                        {incentive.badge && <Chip size="small" label={incentive.badge} color="primary" />}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {incentive.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Reward Points: {incentive.rewardPoints}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Green Loan Opportunities
            </Typography>
            {result.greenLoanOffers.length === 0 ? (
              <Alert severity="info">
                No active green loan programmes detected. Upload additional sustainability documentation to unlock financing offers.
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Bank</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Carbon Score Target</TableCell>
                      <TableCell align="right">Discount</TableCell>
                      <TableCell align="right">Indicative Rate (%)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.greenLoanOffers.map((offer) => (
                      <TableRow key={offer.bankId}>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <BankIcon color="primary" fontSize="small" />
                            <Typography variant="body2">{offer.bankName}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={offer.eligible ? 'Eligible' : 'Improve Score'}
                            color={offer.eligible ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">{offer.minCarbonScore}</TableCell>
                        <TableCell align="right">{offer.discountPercentage}%</TableCell>
                        <TableCell align="right">{offer.indicativeInterestRate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Processed Transactions
            </Typography>
            {result.transactions.length === 0 ? (
              <Alert severity="info">
                No carbon-relevant transactions were detected in the scanned emails.
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Subject</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount (₹)</TableCell>
                      <TableCell align="right">CO₂ (kg)</TableCell>
                      <TableCell align="right">Confidence</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.transactions.map((transaction) => (
                      <TableRow key={transaction.messageId}>
                        <TableCell>{transaction.subject}</TableCell>
                        <TableCell>{transaction.transactionType}</TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell align="right">{transaction.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell align="right">{transaction.co2Emissions.toFixed(2)}</TableCell>
                        <TableCell align="right">{Math.round((transaction.confidence || 0) * 100)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          {(result.skippedEmails.length > 0 || result.failures.length > 0) && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Messages Requiring Attention
              </Typography>
              {result.skippedEmails.length > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {result.skippedEmails.length} messages were skipped due to spam or duplicate detection safeguards.
                </Alert>
              )}
              {result.failures.length > 0 && (
                <Alert severity="warning">
                  {result.failures.length} messages could not be processed. Review mailbox formatting or upload statements manually.
                </Alert>
              )}
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default AICarbonEmailAgent;
