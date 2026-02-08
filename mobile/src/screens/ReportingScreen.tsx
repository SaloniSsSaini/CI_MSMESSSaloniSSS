import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  RefreshControl,
  Share
} from 'react-native';
import { Card, Button, ProgressBar, Chip, DataTable, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
// import Icon from 'react-native-vector-icons/material-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface CarbonData {
  month: string;
  carbonFootprint: number;
  target: number;
  reduction: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface TrendData {
  period: string;
  current: number;
  previous: number;
  change: number;
}

type ExportFormat = 'pdf' | 'excel' | 'csv' | 'brsr';

const ReportingScreen: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [dateRange, setDateRange] = useState('6months');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Sample data - in real app, this would come from API
  const carbonData: CarbonData[] = [
    { month: 'Jan', carbonFootprint: 45.2, target: 40, reduction: 2.1 },
    { month: 'Feb', carbonFootprint: 42.8, target: 40, reduction: 3.2 },
    { month: 'Mar', carbonFootprint: 38.5, target: 40, reduction: 4.8 },
    { month: 'Apr', carbonFootprint: 35.2, target: 40, reduction: 6.1 },
    { month: 'May', carbonFootprint: 32.8, target: 40, reduction: 7.5 },
    { month: 'Jun', carbonFootprint: 29.5, target: 40, reduction: 9.2 }
  ];

  const categoryData: CategoryData[] = [
    { name: 'Energy', value: 35, color: '#8884d8' },
    { name: 'Transportation', value: 25, color: '#82ca9d' },
    { name: 'Waste', value: 20, color: '#ffc658' },
    { name: 'Water', value: 15, color: '#ff7300' },
    { name: 'Materials', value: 5, color: '#00ff00' }
  ];

  const trendData: TrendData[] = [
    { period: 'This Month', current: 29.5, previous: 32.8, change: -10.1 },
    { period: 'This Quarter', current: 101.5, previous: 115.2, change: -11.9 },
    { period: 'This Year', current: 223.8, previous: 245.6, change: -8.9 }
  ];

  const recommendations = [
    {
      id: 1,
      title: 'Switch to LED Lighting',
      impact: 'High',
      cost: 'Low',
      savings: '15% energy reduction',
      status: 'Not Implemented'
    },
    {
      id: 2,
      title: 'Install Solar Panels',
      impact: 'Very High',
      cost: 'High',
      savings: '40% energy reduction',
      status: 'In Progress'
    },
    {
      id: 3,
      title: 'Implement Waste Segregation',
      impact: 'Medium',
      cost: 'Low',
      savings: '20% waste reduction',
      status: 'Completed'
    },
    {
      id: 4,
      title: 'Use Electric Vehicles',
      impact: 'High',
      cost: 'Medium',
      savings: '30% transport emissions',
      status: 'Not Implemented'
    }
  ];

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#1976d2'
    }
  };

  const pieChartData = categoryData.map((item) => ({
    name: item.name,
    value: item.value,
    color: item.color,
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  }));

  const lineChartData = {
    labels: carbonData.map(item => item.month),
    datasets: [
      {
        data: carbonData.map(item => item.carbonFootprint),
        color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
        strokeWidth: 3
      },
      {
        data: carbonData.map(item => item.target),
        color: (opacity = 1) => `rgba(130, 202, 157, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };

  const barChartData = {
    labels: carbonData.map(item => item.month),
    datasets: [
      {
        data: carbonData.map(item => item.reduction)
      }
    ]
  };

  const exportFormatLabels: Record<ExportFormat, string> = {
    pdf: 'PDF',
    excel: 'Excel',
    csv: 'CSV',
    brsr: 'BRSR'
  };

  const handleExport = () => {
    Alert.alert('Export Report', `Report exported as ${exportFormatLabels[exportFormat]} successfully!`);
    setExportModalVisible(false);
  };

  const handleEmailReport = () => {
    Alert.alert('Email Report', `Report sent to ${email} successfully!`);
    setEmailModalVisible(false);
    setEmail('');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out my sustainability report from Carbon Intelligence!',
        title: 'Sustainability Report'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Very High': return '#f44336';
      case 'High': return '#ff9800';
      case 'Medium': return '#2196f3';
      case 'Low': return '#4caf50';
      default: return '#757575';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return '#4caf50';
      case 'In Progress': return '#ff9800';
      case 'Not Implemented': return '#757575';
      default: return '#757575';
    }
  };

  const renderOverviewTab = () => (
    <View>
      {/* Carbon Footprint Trend */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text >Carbon Footprint Trend</Text>
          <LineChart
            data={lineChartData}
            width={width - 80}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Emissions by Category */}
      <Card 
      style={styles.chartCard}
      >
        <Card.Content>
          <Text >Emissions by Category</Text>
          <PieChart
            data={pieChartData}
            width={width - 80}
            height={220}
            chartConfig={chartConfig}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Key Performance Indicators */}
      <Card style={styles.kpiCard}>
        <Card.Content>
          <Text >Key Performance Indicators</Text>
          {trendData.map((trend, index) => (
            <View key={index} style={styles.kpiItem}>
              <Text style={styles.kpiValue}>{trend.current.toFixed(1)} tCO₂</Text>
              <Text style={styles.kpiLabel}>{trend.period}</Text>
              <View style={styles.kpiChange}>
                <Icon
                  name={trend.change < 0 ? 'trending-down' : 'trending-up'}
                  size={16}
                  color={trend.change < 0 ? '#4caf50' : '#f44336'}
                />
                <Text style={[
                  styles.kpiChangeText,
                  { color: trend.change < 0 ? '#4caf50' : '#f44336' }
                ]}>
                  {Math.abs(trend.change).toFixed(1)}% vs previous
                </Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>
    </View>
  );

  const renderCarbonFootprintTab = () => (
    <View>
      {/* Monthly Analysis */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text >Monthly Carbon Footprint Analysis</Text>
          <LineChart
            data={lineChartData}
            width={width - 80}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Reduction Progress */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text >Reduction Progress</Text>
          <BarChart
            data={barChartData}
            width={width - 80}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Category Breakdown */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text >Category Breakdown</Text>
          <PieChart
            data={pieChartData}
            width={width - 80}
            height={220}
            chartConfig={chartConfig}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </Card.Content>
      </Card>
    </View>
  );

  const renderRecommendationsTab = () => (
    <Card style={styles.tableCard}>
      <Card.Content>
        <Text >Sustainability Recommendations</Text>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Recommendation</DataTable.Title>
            <DataTable.Title>Impact</DataTable.Title>
            <DataTable.Title>Status</DataTable.Title>
          </DataTable.Header>
          {recommendations.map((rec) => (
            <DataTable.Row key={rec.id}>
              <DataTable.Cell>
                <View>
                  <Text style={styles.recommendationTitle}>{rec.title}</Text>
                  <Text style={styles.recommendationSavings}>{rec.savings}</Text>
                </View>
              </DataTable.Cell>
              <DataTable.Cell>
                <Chip
                  mode="outlined"
                  textStyle={{ color: getImpactColor(rec.impact) }}
                  style={[styles.impactChip, { borderColor: getImpactColor(rec.impact) }]}
                >
                  {rec.impact}
                </Chip>
              </DataTable.Cell>
              <DataTable.Cell>
                <Chip
                  mode="outlined"
                  textStyle={{ color: getStatusColor(rec.status) }}
                  style={[styles.statusChip, { borderColor: getStatusColor(rec.status) }]}
                >
                  {rec.status}
                </Chip>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </Card.Content>
    </Card>
  );

  const renderTrendsTab = () => (
    <View>
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text >Performance Trends</Text>
          <LineChart
            data={lineChartData}
            width={width - 80}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>
    </View>
  );

  const renderComparisonsTab = () => (
    <View>
      {/* Industry Comparison */}
      <Card style={styles.comparisonCard}>
        <Card.Content>
          <Text >Industry Comparison</Text>
          <Text style={styles.comparisonSubtitle}>Your Performance vs Industry Average</Text>
          
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonLabel}>Your Carbon Footprint</Text>
            <Text style={styles.comparisonValue}>29.5 tCO₂</Text>
            <ProgressBar progress={0.65} color="#1976d2" style={styles.comparisonProgress} />
          </View>
          
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonLabel}>Industry Average</Text>
            <Text style={styles.comparisonValue}>45.2 tCO₂</Text>
            <ProgressBar progress={1.0} color="#757575" style={styles.comparisonProgress} />
          </View>
          
          <Text style={styles.comparisonResult}>
            You're performing 35% better than industry average!
          </Text>
        </Card.Content>
      </Card>

      {/* Goal Progress */}
      <Card style={styles.comparisonCard}>
        <Card.Content>
          <Text >Goal Progress</Text>
          <Text style={styles.comparisonSubtitle}>Annual Carbon Reduction Goal</Text>
          
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonLabel}>Progress</Text>
            <Text style={styles.comparisonValue}>75%</Text>
            <ProgressBar progress={0.75} color="#4caf50" style={styles.comparisonProgress} />
          </View>
          
          <Text style={styles.comparisonSubtitle}>Target: 40% reduction by end of year</Text>
          <Text style={styles.comparisonResult}>On track to exceed goal!</Text>
        </Card.Content>
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Icon name="assessment" size={32} color="#1976d2" />
          <Text style={styles.headerTitle}>Sustainability Reports</Text>
          <TouchableOpacity onPress={handleShare}>
            <Icon name="share" size={24} color="#1976d2" />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            // icon="download"
            onPress={() => setExportModalVisible(true)}
            style={styles.actionButton}
          >
            Export
          </Button>
          <Button
            mode="outlined"
            // icon="email"
            onPress={() => setEmailModalVisible(true)}
            style={styles.actionButton}
          >
            Email
          </Button>
          <Button
            mode="outlined"
            // icon="share"
            // icon="print"
            onPress={() => Alert.alert('Print', 'Print functionality would be implemented here')}
            style={styles.actionButton}
          >
            Print
          </Button>
        </View>

        {/* Filters */}
        <Card style={styles.filterCard}>
          <Card.Content>
            <Text >Report Filters</Text>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Date Range:</Text>
              <SegmentedButtons
                value={dateRange}
                onValueChange={setDateRange}
                buttons={[
                  { value: '1month', label: '1M' },
                  { value: '3months', label: '3M' },
                  { value: '6months', label: '6M' },
                  { value: '1year', label: '1Y' },
                ]}
                style={styles.segmentedButtons}
              />
            </View>
            <Button mode="contained" style={styles.generateButton}>
              Generate Report
            </Button>
          </Card.Content>
        </Card>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabButtons}>
              {['overview', 'carbon', 'recommendations', 'trends', 'comparisons'].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tabButton,
                    selectedTab === tab && styles.activeTabButton
                  ]}
                  onPress={() => setSelectedTab(tab)}
                >
                  <Text style={[
                    styles.tabButtonText,
                    selectedTab === tab && styles.activeTabButtonText
                  ]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Tab Content */}
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'carbon' && renderCarbonFootprintTab()}
        {selectedTab === 'recommendations' && renderRecommendationsTab()}
        {selectedTab === 'trends' && renderTrendsTab()}
        {selectedTab === 'comparisons' && renderComparisonsTab()}
      </ScrollView>

      {/* Export Modal */}
      <Modal
        visible={exportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Export Report</Text>
              <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                <Icon name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Choose export format:</Text>
            <View style={styles.exportButtons}>
              <Button
                mode={exportFormat === 'pdf' ? 'contained' : 'outlined'}
                onPress={() => setExportFormat('pdf')}
                style={styles.exportButton}
              >
                {exportFormatLabels.pdf}
              </Button>
              <Button
                mode={exportFormat === 'excel' ? 'contained' : 'outlined'}
                onPress={() => setExportFormat('excel')}
                style={styles.exportButton}
              >
                {exportFormatLabels.excel}
              </Button>
              <Button
                mode={exportFormat === 'csv' ? 'contained' : 'outlined'}
                onPress={() => setExportFormat('csv')}
                style={styles.exportButton}
              >
                {exportFormatLabels.csv}
              </Button>
              <Button
                mode={exportFormat === 'brsr' ? 'contained' : 'outlined'}
                onPress={() => setExportFormat('brsr')}
                style={styles.exportButton}
              >
                {exportFormatLabels.brsr}
              </Button>
            </View>
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setExportModalVisible(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleExport}
                style={styles.modalButton}
              >
                Export
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Email Modal */}
      <Modal
        visible={emailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Email Report</Text>
              <TouchableOpacity onPress={() => setEmailModalVisible(false)}>
                <Icon name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.emailInput}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.modalSubtitle}>
              The report will be sent as a PDF attachment to the specified email address.
            </Text>
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setEmailModalVisible(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleEmailReport}
                disabled={!email}
                style={styles.modalButton}
              >
                Send Report
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    flex: 1,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  filterCard: {
    margin: 16,
    marginTop: 0,
    elevation: 4,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    marginRight: 16,
  },
  segmentedButtons: {
    flex: 1,
  },
  generateButton: {
    marginTop: 8,
  },
  tabContainer: {
    backgroundColor: '#fff',
    elevation: 2,
  },
  tabButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activeTabButton: {
    backgroundColor: '#1976d2',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#757575',
  },
  activeTabButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  chartCard: {
    margin: 16,
    marginTop: 8,
    elevation: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  kpiCard: {
    margin: 16,
    marginTop: 8,
    elevation: 4,
  },
  kpiItem: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  kpiLabel: {
    fontSize: 14,
    color: '#757575',
    marginVertical: 4,
  },
  kpiChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiChangeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  tableCard: {
    margin: 16,
    marginTop: 8,
    elevation: 4,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  recommendationSavings: {
    fontSize: 12,
    color: '#757575',
  },
  impactChip: {
    alignSelf: 'flex-start',
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  comparisonCard: {
    margin: 16,
    marginTop: 8,
    elevation: 4,
  },
  comparisonSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 16,
  },
  comparisonItem: {
    marginBottom: 16,
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  comparisonProgress: {
    height: 8,
    borderRadius: 4,
  },
  comparisonResult: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: 'bold',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: width * 0.9,
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 16,
  },
  exportButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  exportButton: {
    flexGrow: 1,
    flexBasis: '48%',
    marginHorizontal: 4,
    marginBottom: 8,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default ReportingScreen;