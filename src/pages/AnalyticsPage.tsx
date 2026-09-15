import { useMemo } from 'react';
import { useVehicle } from '../context/VehicleContext';
import { useTheme } from '../context/ThemeContext';
import { GarageComparisonMatrix } from '../components/common/GarageComparisonMatrix';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon } from 'lucide-react';
import { formatAmount, formatDistance, formatEfficiency } from '../lib/utils';
import type { FuelRecord, ServiceRecord, ExpenseRecord } from '../types';

export function AnalyticsPage() {
  const { activeVehicle, fuelRecords, serviceRecords, expenseRecords, metrics, settings } = useVehicle();
  const { isDark } = useTheme();

  if (!activeVehicle) return null;

  // Monochrome & subtle shades for charts
  const gridColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#a1a1aa' : '#71717a';

  // 1. Expense Distribution Data
  const categoryDistributionData = useMemo(() => {
    const data: { name: string; value: number; color: string }[] = [];

    const palette = isDark
      ? ['#fafafa', '#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a']
      : ['#18181b', '#52525b', '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7'];

    if (metrics.totalFuelSpent > 0) {
      data.push({ name: 'Fuel', value: metrics.totalFuelSpent, color: palette[0] });
    }
    if (metrics.totalServiceSpent > 0) {
      data.push({ name: 'Service & Parts', value: metrics.totalServiceSpent, color: palette[1] });
    }

    const expenseMap: { [key: string]: number } = {};
    expenseRecords.forEach((e: ExpenseRecord) => {
      const cat = e.category.toUpperCase().replace('_', ' ');
      expenseMap[cat] = (expenseMap[cat] || 0) + e.amount;
    });

    let idx = 2;
    Object.entries(expenseMap).forEach(([cat, val]) => {
      data.push({
        name: cat,
        value: val,
        color: palette[idx % palette.length],
      });
      idx++;
    });

    return data;
  }, [metrics, expenseRecords, isDark]);

  // 2. Monthly Spend Breakdown
  const monthlySpendData = useMemo(() => {
    const monthsMap: { [key: string]: { month: string; fuel: number; service: number; expense: number; total: number } } = {};

    const getKey = (isoDate: string) => {
      const d = new Date(isoDate);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const getLabel = (isoDate: string) => {
      const d = new Date(isoDate);
      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    };

    fuelRecords.forEach((f: FuelRecord) => {
      const key = getKey(f.dateTime);
      if (!monthsMap[key]) monthsMap[key] = { month: getLabel(f.dateTime), fuel: 0, service: 0, expense: 0, total: 0 };
      monthsMap[key].fuel += f.amountSpent;
      monthsMap[key].total += f.amountSpent;
    });

    serviceRecords.forEach((s: ServiceRecord) => {
      const key = getKey(s.dateTime);
      if (!monthsMap[key]) monthsMap[key] = { month: getLabel(s.dateTime), fuel: 0, service: 0, expense: 0, total: 0 };
      monthsMap[key].service += s.totalCost;
      monthsMap[key].total += s.totalCost;
    });

    expenseRecords.forEach((e: ExpenseRecord) => {
      const key = getKey(e.dateTime);
      if (!monthsMap[key]) monthsMap[key] = { month: getLabel(e.dateTime), fuel: 0, service: 0, expense: 0, total: 0 };
      monthsMap[key].expense += e.amount;
      monthsMap[key].total += e.amount;
    });

    return Object.keys(monthsMap)
      .sort()
      .map(k => monthsMap[k]);
  }, [fuelRecords, serviceRecords, expenseRecords]);

  // 3. Fuel Mileage Over Time (Chronological)
  const mileageTrendData = useMemo(() => {
    return [...fuelRecords]
      .filter((f: FuelRecord) => f.calculatedEfficiencyKmpl && f.calculatedEfficiencyKmpl > 0)
      .reverse()
      .map((f: FuelRecord, i: number) => ({
        index: i + 1,
        date: new Date(f.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        kmpl: Number(f.calculatedEfficiencyKmpl?.toFixed(1)),
        odometer: f.odometer,
      }));
  }, [fuelRecords]);

  return (
    <div className="space-y-5 pb-24 md:pb-12">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          <span>Vehicle Analytics</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Cost breakdown and efficiency trends for {activeVehicle.name}
        </p>
      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground font-medium">Lifetime Cost</p>
          <p className="text-base sm:text-xl font-bold text-foreground font-mono mt-1">
            {formatAmount(metrics.totalOverallSpent)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">All expenses</p>
        </div>

        <div className="p-3.5 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground font-medium">Cost / {settings.distanceUnit}</p>
          <p className="text-base sm:text-xl font-bold text-foreground font-mono mt-1">
            {metrics.overallCostPerKm > 0 ? `${metrics.overallCostPerKm.toFixed(2)} / ${settings.distanceUnit}` : '--'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Running rate</p>
        </div>

        <div className="p-3.5 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground font-medium">Avg Mileage</p>
          <p className="text-base sm:text-xl font-bold text-foreground font-mono mt-1">
            {formatEfficiency(metrics.averageFuelEfficiency, settings.distanceUnit, settings.fuelVolumeUnit)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">All fill-ups</p>
        </div>

        <div className="p-3.5 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground font-medium">Total Distance</p>
          <p className="text-base sm:text-xl font-bold text-foreground font-mono mt-1">
            {formatDistance(metrics.totalDistanceDriven, settings.distanceUnit)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Logged</p>
        </div>
      </div>

      {/* Multi-Vehicle Garage Comparison Matrix */}
      <GarageComparisonMatrix />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Spend Bar Chart */}
        <Card className="border-border">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <span>Monthly Spending</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-2">
            {monthlySpendData.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-xs text-muted-foreground">
                No monthly data recorded yet.
              </div>
            ) : (
              <div className="h-60 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlySpendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} />
                    <XAxis dataKey="month" stroke={textColor} fontSize={11} />
                    <YAxis stroke={textColor} fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#18181b' : '#ffffff',
                        borderColor: isDark ? '#27272a' : '#e4e4e7',
                        borderRadius: '0.375rem',
                        fontSize: '12px',
                      }}
                      formatter={(val: number) => [formatAmount(val)]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="fuel" name="Fuel" fill={isDark ? '#fafafa' : '#18181b'} stackId="a" />
                    <Bar dataKey="service" name="Service" fill={isDark ? '#a1a1aa' : '#71717a'} stackId="a" />
                    <Bar dataKey="expense" name="Other" fill={isDark ? '#52525b' : '#d4d4d8'} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Breakdown Pie Chart */}
        <Card className="border-border">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-muted-foreground" />
              <span>Cost Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-2">
            {categoryDistributionData.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-xs text-muted-foreground">
                No expense entries to display.
              </div>
            ) : (
              <div className="h-60 sm:h-64 w-full flex flex-col sm:flex-row items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {categoryDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke={isDark ? '#18181b' : '#ffffff'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#18181b' : '#ffffff',
                        borderColor: isDark ? '#27272a' : '#e4e4e7',
                        borderRadius: '0.375rem',
                        fontSize: '12px',
                      }}
                      formatter={(val: number) => [formatAmount(val)]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mileage Trend Line Chart */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span>Fuel Mileage ({settings.distanceUnit}/{settings.fuelVolumeUnit}) Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-2">
            {mileageTrendData.length < 2 ? (
              <div className="h-56 flex flex-col items-center justify-center text-xs text-muted-foreground space-y-1">
                <p>Need at least 2 full-tank fill-up records to plot fuel efficiency curve.</p>
                <p className="text-[11px] text-muted-foreground/70">Log consecutive full tanks to see your mileage stats.</p>
              </div>
            ) : (
              <div className="h-60 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mileageTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} />
                    <XAxis dataKey="date" stroke={textColor} fontSize={11} />
                    <YAxis stroke={textColor} fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#18181b' : '#ffffff',
                        borderColor: isDark ? '#27272a' : '#e4e4e7',
                        borderRadius: '0.375rem',
                        fontSize: '12px',
                      }}
                      formatter={(val: number) => [`${val} ${settings.distanceUnit}/${settings.fuelVolumeUnit}`, 'Fuel Economy']}
                    />
                    <Line
                      type="monotone"
                      dataKey="kmpl"
                      name="Mileage"
                      stroke={isDark ? '#fafafa' : '#18181b'}
                      strokeWidth={2}
                      dot={{ r: 3, fill: isDark ? '#fafafa' : '#18181b' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
