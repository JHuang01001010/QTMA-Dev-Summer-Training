import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { getLogs, getGoal } from '../lib/api';
import type { UsageLog, Goal } from '../lib/api';
import { toLocalDateString, todayLocalDateString } from '../lib/date';
import { formatDuration } from '../lib/format';

const screenWidth = Dimensions.get('window').width;

// Candidate gap between Y-axis gridlines, in hours, smallest first. The first one that
// keeps the axis within MAX_Y_SEGMENTS lines wins, so a light day gets half-hour
// gridlines and a heavy one falls back to coarser steps instead of crowding.
const Y_AXIS_STEPS = [0.5, 1, 2, 4, 6, 12];
const MAX_Y_SEGMENTS = 5;

// Preset colors for pie chart
const PLATFORM_COLORS: Record<string, string> = {
  TikTok: '#ff0050',
  Instagram: '#e1306c',
  YouTube: '#ff0000',
  X: '#000000',
  Reddit: '#ff4500',
  Snapchat: '#fffc00',
  Other: '#9ca3af',
};

export default function Dashboard() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  // For loading session ID
  const [loading, setLoading] = useState(true);

  // On screen focus, fetch session ID, logs, goal
  useFocusEffect(
    useCallback(() => { // outer function sync for useFocusEffect 
      (async () => { // inner function async for await
        const id = await AsyncStorage.getItem('session_id');
        setSessionId(id);
        if (id) {
          try {
            // Run getLogs, getGoal at same time
            const [logsData, goalData] = await Promise.all([getLogs(id), getGoal(id)]);
            setLogs(logsData);
            setGoal(goalData);
          } catch (e) {
            console.warn('Failed to load dashboard data', e);
          }
        }
        setLoading(false);
      })();
    }, []) // No need to rebuild, no props change
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  // Sum today's scroll time
  const today = todayLocalDateString();
  const todaysLogs = logs.filter((log) => log.logged_date === today);
  const todayTotal = todaysLogs.reduce((sum, log) => sum + log.minutes_spent, 0);

  // Sum week's scroll time
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);
  const oneWeekAgoStr = toLocalDateString(oneWeekAgo);
  const weekTotal = logs.filter((log) => log.logged_date >= oneWeekAgoStr).reduce((sum, log) => sum + log.minutes_spent, 0);

  // Dictionary of platform name:minutes spent on that platform
  const minutesByPlatform: Record<string, number> = {};
  todaysLogs.forEach((log) => {
    minutesByPlatform[log.platform_name] = (minutesByPlatform[log.platform_name] || 0) + log.minutes_spent;
  });

  // Map each platform to its color and size/population by minutes for pie chart
  const pieData = Object.entries(minutesByPlatform).map(([platform, minutes]) => ({
    name: platform,
    population: minutes,
    color: PLATFORM_COLORS[platform] || '#9ca3af',
    legendFontColor: '#333',
    legendFontSize: 13,
  }));

  // Array that gets last 6 days + today as YYYY-MM-DD
  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(toLocalDateString(d));
  }

  // Array of daily logs of minutes per last 7 days
  const dayTotals = last7Days.map((dateStr) =>
    logs.filter((log) => log.logged_date === dateStr).reduce((sum, log) => sum + log.minutes_spent, 0)
  );

  // Convert days YYYY-MM-DD to Date objects
  const dayLabels = last7Days.map((dateStr) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })
  );

  // Array of the hours portion of scroll time each day 
  const dayTotalsHours = dayTotals.map((m) => Math.round((m / 60) * 10) / 10);

  // Goal as hours, rounded the same way as the daily totals so the dashed line and
  // the axis bound below are computed from the identical value
  const goalHours = goal ? Math.round((goal.daily_limit_minutes / 60) * 10) / 10 : 0;

  // chart-kit spreads its gridlines evenly between 0 and the largest plotted value,
  // so an awkward max (1.5h over the default 4 segments) puts labels at 0.375/0.75/1.125.
  // Rounding those to the nearest half hour for display produced duplicates ("1.0h, 1.0h")
  // sitting on gridlines that weren't actually at those values. Instead, pick a round
  // step and pin the top of the axis to a multiple of it, so every label is exact.
  // Tallest thing the chart has to fit: the busiest day, or the goal line above it
  const maxPlottedHours = Math.max(...dayTotalsHours, goalHours, 0);
  const yStep =
    Y_AXIS_STEPS.find((step) => Math.ceil(maxPlottedHours / step) <= MAX_Y_SEGMENTS) ??
    Y_AXIS_STEPS[Y_AXIS_STEPS.length - 1];
  // At least 2 segments so a week with nothing logged still draws a readable axis
  const ySegments = Math.max(2, Math.ceil(maxPlottedHours / yStep));
  const yAxisMax = yStep * ySegments;

  // Construct line graph of daily scroll time over a week
  const lineData = goal
    ? {
      // Scroll time data and goal line
        labels: dayLabels,
        datasets: [
          { data: dayTotalsHours, color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`, strokeWidth: 2 },
          { data: last7Days.map(() => goalHours), color: () => `rgba(220, 38, 38, 1)`, 
            strokeWidth: 2, strokeDashArray: [6, 4], withDots: false },
          ],
        legend: ['Minutes logged', 'Daily goal'],
      }
    : {
      // Just scroll time data if no goal set
        labels: dayLabels,
        datasets: [{ data: dayTotalsHours, color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`, strokeWidth: 2 }],
      };
  
  // Goal percentage par 
  let goalProgressPercent;

  if (!goal) {
    // Case 1: No goal has been saved at all
    goalProgressPercent = 0;

  } else if (goal.daily_limit_minutes > 0) {
    // Case 2: A goal exists, and it's a normal, positive number of minutes
    goalProgressPercent = Math.min((todayTotal / goal.daily_limit_minutes) * 100, 100);

  } else if (todayTotal > 0) {
    // Case 3: A goal exists, it's exactly 0 minutes, and the user has logged some usage
    goalProgressPercent = 100;

  } else {
    // Case 4: A goal exists, it's exactly 0 minutes, and the user has logged nothing
    goalProgressPercent = 0;
  }

  
  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Dashboard</Text>
      <Text>Session: {sessionId}</Text>

      {/* Daily and Weekly Usage as h,min */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{formatDuration(todayTotal)}</Text>
          <Text style={styles.statLabel}>today</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{formatDuration(weekTotal)}</Text>
          <Text style={styles.statLabel}>this week</Text>
        </View>
      </View>

      {/* Goal Display */}
      {goal && (
        <View style={styles.goalBox}>
          <Text style={styles.goalText}>
            {formatDuration(todayTotal)} / {formatDuration(goal.daily_limit_minutes)} today
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,{ width: `${goalProgressPercent}%`, backgroundColor: todayTotal > goal.daily_limit_minutes ? '#dc2626' : '#2563eb' },
              ]}
            />
          </View>
        </View>
      )}

      {/* Pie Chart */}
      <Text style={styles.chartTitle}>Today's usage by platform</Text>
      {pieData.length > 0 ? (
        <PieChart 
          data={pieData} 
          width={screenWidth - 48} 
          height={200} 
          chartConfig={{ color: () => '#000' }} 
          accessor="population" 
          backgroundColor="transparent" 
          paddingLeft="15"/>
      ) : (
        <Text style={styles.emptyText}>No usage logged today yet.</Text>
      )}

      {/* Line Chart, increment multiples of .5hrs only */}
      <Text style={styles.chartTitle}>Minutes per day (last 7 days)</Text>
      <LineChart
        data={lineData}
        width={screenWidth - 48}
        height={220}
        yAxisSuffix="h"
        fromZero
        fromNumber={yAxisMax}
        segments={ySegments}
        chartConfig={{
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(50, 50, 50, ${opacity})`,
          propsForDots: { r: '4', strokeWidth: '2', stroke: '#2563eb' },
          fillShadowGradientOpacity: 0,
          fillShadowGradientFromOpacity: 0,
          fillShadowGradientToOpacity: 0,
        }}
        style={styles.chart}
      />

      <Text style={styles.entryCount}>Logged entries: {logs.length}</Text>

      {/* Log Usage Button */}
      <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: '/log', params: { sessionId } })}>
        <Text style={styles.buttonText}>Log usage</Text>
      </TouchableOpacity>

      {/* Set Goal Button */}
      <TouchableOpacity style={styles.goalButton} onPress={() => router.push({ pathname: '/goals', params: { sessionId } })}>
        <Text style={styles.goalButtonText}>Set goal</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 24, gap: 12, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  statBox: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 10, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '700', color: '#2563eb' },
  statLabel: { fontSize: 13, color: '#555', marginTop: 4 },
  goalBox: { marginTop: 12 },
  goalText: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  progressTrack: { height: 10, backgroundColor: '#e5e7eb', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  chartTitle: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  chart: { borderRadius: 10, marginLeft: -16 },
  emptyText: { color: '#999', fontStyle: 'italic', marginTop: 8 },
  entryCount: { fontSize: 13, color: '#999', marginTop: 4 },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: '600' },
  goalButton: { borderWidth: 1, borderColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  goalButtonText: { color: '#2563eb', fontWeight: '600' },
});
