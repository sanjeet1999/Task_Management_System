'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/utils/logger';

interface TaskStatusCount {
  name: string;
  value: number;
}

const COLORS = {
  Pending: '#fbbf24',     // amber-400
  'In Progress': '#3b82f6', // blue-500
  Completed: '#22c55e',   // green-500
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  value,
}: any) => {
  if (value === 0) return null;
  
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="12"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function TaskStatusChart() {
  const [data, setData] = useState<TaskStatusCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTaskStats() {
      try {
        const response = await fetch('/api/dashboard/stats', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch task statistics');
        }
        
        const stats = await response.json();
        logger.debug('TaskStatusChart', 'Fetched task stats', stats);

        // Transform the data for the pie chart
        const chartData = [
          {
            name: 'Pending',
            value: stats.pendingTasks || 0
          },
          {
            name: 'In Progress',
            value: stats.inProgressTasks || 0
          },
          {
            name: 'Completed',
            value: stats.completedTasks || 0
          }
        ];
        
        setData(chartData);
      } catch (err) {
        logger.error('TaskStatusChart', 'Error fetching task stats', { error: err });
        setError('Failed to load task statistics');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTaskStats();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-red-500">
          {error}
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-gray-500">
          No tasks found. Create your first task to see the distribution.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Status Distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              innerRadius={40}
              dataKey="value"
              nameKey="name"
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[entry.name as keyof typeof COLORS]}
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => [
                `${value} task${value !== 1 ? 's' : ''}`,
                name
              ]}
            />
            <Legend 
              formatter={(value: string) => {
                const item = data.find(d => d.name === value);
                const count = item?.value || 0;
                const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
                return `${value} (${count} - ${percentage}%)`;
              }}
              verticalAlign="middle"
              align="right"
              layout="vertical"
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
} 