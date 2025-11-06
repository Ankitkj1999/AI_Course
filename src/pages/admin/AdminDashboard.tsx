// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import { Users, Play, RotateCcw, DollarSign, TrendingUp, BookOpen, CreditCard, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { serverURL } from '@/constants';
import axios from 'axios';

const usersPieData = [
  { name: 'Free', value: 0, color: '#F7F7F7' },
  { name: 'Paid', value: 0, color: '#393E46' },
];

const coursesPieData = [
  { name: 'Text', value: 0, color: '#393E46' },
  { name: 'Video', value: 0, color: '#F7F7F7' },
];

const userChartConfig = {
  free: { label: 'Free' },
  paid: { label: 'Paid' },
};

const courseChartConfig = {
  text: { label: 'Text' },
  video: { label: 'Video' },
};

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({});

  useEffect(() => {
    async function dashboardData() {
      const postURL = serverURL + `/api/dashboard`;
      const response = await axios.post(postURL);
      localStorage.setItem('terms', response.data.admin.terms)
      localStorage.setItem('privacy', response.data.admin.privacy)
      localStorage.setItem('cancel', response.data.admin.cancel)
      localStorage.setItem('refund', response.data.admin.refund)
      localStorage.setItem('billing', response.data.admin.billing)
      usersPieData[0].value = response.data.paid;
      usersPieData[1].value = response.data.free;
      coursesPieData[0].value = response.data.courses - response.data.videoType;
      coursesPieData[1].value = response.data.videoType;
      setData(response.data);
      setIsLoading(false);
    }
    dashboardData();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of your platform's performance and key metrics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {isLoading ? (
          // Loading skeleton for stats cards
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-border/50 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          // Actual cards content
          <>
            <Card className="border-border/50 hover:shadow-lg transition-all duration-200 hover:border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{data.users?.toLocaleString()}</div>
                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                  <span>Active platform users</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-lg transition-all duration-200 hover:border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Courses</CardTitle>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{data.courses?.toLocaleString()}</div>
                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4 mr-1 text-purple-500" />
                  <span>Learning content created</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-lg transition-all duration-200 hover:border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <RotateCcw className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">${data.sum?.toLocaleString()}</div>
                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                  <span>Recurring subscriptions</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-lg transition-all duration-200 hover:border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">${data.total?.toLocaleString()}</div>
                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4 mr-1 text-orange-500" />
                  <span>All-time earnings</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 lg:gap-6">
        {isLoading ? (
          // Loading skeleton for charts
          <>
            {[1, 2].map((i) => (
              <Card key={i} className="border-border/50 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </CardHeader>
                <CardContent className="h-64 sm:h-72 md:h-80">
                  <div className="flex items-center justify-center h-full">
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                      <Skeleton className="w-32 h-32 sm:w-40 sm:h-40 rounded-full" />
                      <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center items-center mt-4 sm:mt-6 space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="flex items-center">
                      <Skeleton className="h-3 w-3 mr-2 rounded-full" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex items-center">
                      <Skeleton className="h-3 w-3 mr-2 rounded-full" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className="border-border/50 hover:shadow-lg transition-all duration-200 p-1 sm:p-0">
              <CardHeader className="pb-4 px-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg sm:text-xl font-semibold">User Distribution</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">{data.users} total</span>
                    <span className="sm:hidden">{data.users}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-64 sm:h-72 md:h-80">
                <ChartContainer config={userChartConfig} className="h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={usersPieData}
                        cx="50%"
                        cy="45%"
                        innerRadius="35%"
                        outerRadius="65%"
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {usersPieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index === 0 ? '#3b82f6' : '#10b981'}
                            stroke="var(--background)"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="flex flex-col sm:flex-row justify-center items-center mt-4 sm:mt-6 space-y-4 sm:space-y-0 sm:space-x-8">
                  <div className="flex items-center">
                    <div className="h-3 w-3 bg-blue-500 rounded-full mr-3" />
                    <div className="text-center sm:text-left">
                      <div className="font-semibold text-foreground">{usersPieData[0].value}</div>
                      <div className="text-sm text-muted-foreground">Free Users</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="h-3 w-3 bg-green-500 rounded-full mr-3" />
                    <div className="text-center sm:text-left">
                      <div className="font-semibold text-foreground">{usersPieData[1].value}</div>
                      <div className="text-sm text-muted-foreground">Paid Users</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-lg transition-all duration-200 p-1 sm:p-0">
              <CardHeader className="pb-4 px-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg sm:text-xl font-semibold">Course Types</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">{data.courses} total</span>
                    <span className="sm:hidden">{data.courses}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-64 sm:h-72 md:h-80">
                <ChartContainer config={courseChartConfig} className="h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={coursesPieData}
                        cx="50%"
                        cy="45%"
                        innerRadius="35%"
                        outerRadius="65%"
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {coursesPieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index === 0 ? '#8b5cf6' : '#f59e0b'}
                            stroke="var(--background)"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="flex flex-col sm:flex-row justify-center items-center mt-4 sm:mt-6 space-y-4 sm:space-y-0 sm:space-x-8">
                  <div className="flex items-center">
                    <div className="h-3 w-3 bg-purple-500 rounded-full mr-3" />
                    <div className="text-center sm:text-left">
                      <div className="font-semibold text-foreground">{coursesPieData[0].value}</div>
                      <div className="text-sm text-muted-foreground">Text Courses</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="h-3 w-3 bg-amber-500 rounded-full mr-3" />
                    <div className="text-center sm:text-left">
                      <div className="font-semibold text-foreground">{coursesPieData[1].value}</div>
                      <div className="text-sm text-muted-foreground">Video Courses</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
