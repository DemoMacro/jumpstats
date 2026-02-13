type DimensionTab = "devices" | "browsers" | "referers" | "utm";
type TimeGranularity = "hour" | "day" | "week" | "month";

interface Range {
  start: Date;
  end: Date;
}

type TimeseriesData = {
  timestamp: Date;
  clicks: string | number;
};

type DimensionData = {
  [key: string]: string | number;
  clicks: string;
};

export function useLinkAnalytics(linkId: string, externalRange?: Ref<Range>) {
  const { $authClient } = useNuxtApp();

  // Use external range if provided, otherwise create internal one
  const range =
    externalRange ||
    ref<Range>({
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(),
    });
  const activeTab = ref<DimensionTab>("devices");
  const timeGranularity = ref<TimeGranularity>("hour");

  // Data refs
  const timeseries = ref<TimeseriesData[]>([]);
  const countries = ref<DimensionData[]>([]);
  const devices = ref<DimensionData[]>([]);
  const browsers = ref<DimensionData[]>([]);
  const referers = ref<DimensionData[]>([]);
  const utmSources = ref<DimensionData[]>([]);

  const totalClicks = ref(0);
  const uniqueVisitors = ref(0);

  const loading = ref(false);
  const error = ref<string | null>(null);

  // Helper to convert Date to ISO string format
  const toISOString = (date: Date) => {
    return date.toISOString().slice(0, 19).replace("T", " ");
  };

  async function fetchAllData() {
    loading.value = true;
    error.value = null;

    try {
      // Prepare date range parameters
      const start = toISOString(range.value.start);
      const end = toISOString(range.value.end);

      // Fetch all data in parallel
      const [
        countResult,
        timeseriesResult,
        countriesResult,
        devicesResult,
        browsersResult,
        referersResult,
        utmSourcesResult,
      ] = await Promise.all([
        $authClient.link.analytics({
          query: { linkId, groupBy: "count", start, end },
        }),
        $authClient.link.analytics({
          query: { linkId, groupBy: "timeseries", start, end },
        }),
        $authClient.link.analytics({
          query: { linkId, groupBy: "countries", start, end },
        }),
        $authClient.link.analytics({
          query: { linkId, groupBy: "devices", start, end },
        }),
        $authClient.link.analytics({
          query: { linkId, groupBy: "browsers", start, end },
        }),
        $authClient.link.analytics({
          query: { linkId, groupBy: "referers", start, end },
        }),
        $authClient.link.analytics({
          query: { linkId, groupBy: "utm_sources", start, end },
        }),
      ]);

      // Handle count result
      if (countResult.data && "totalClicks" in countResult.data) {
        totalClicks.value = Number(
          (countResult.data as { totalClicks: string | number }).totalClicks,
        );
      }

      // Handle timeseries
      if (timeseriesResult.data && "data" in timeseriesResult.data) {
        timeseries.value = (timeseriesResult.data as { data: TimeseriesData[] }).data;
      }

      // Handle countries
      if (countriesResult.data && "data" in countriesResult.data) {
        countries.value = (countriesResult.data as { data: DimensionData[] }).data;
      }

      // Handle devices
      if (devicesResult.data && "data" in devicesResult.data) {
        devices.value = (devicesResult.data as { data: DimensionData[] }).data;
      }

      // Handle browsers
      if (browsersResult.data && "data" in browsersResult.data) {
        browsers.value = (browsersResult.data as { data: DimensionData[] }).data;
      }

      // Handle referers
      if (referersResult.data && "data" in referersResult.data) {
        referers.value = (referersResult.data as { data: DimensionData[] }).data;
      }

      // Handle UTM sources
      if (utmSourcesResult.data && "data" in utmSourcesResult.data) {
        utmSources.value = (utmSourcesResult.data as { data: DimensionData[] }).data;
      }

      // Calculate unique visitors (approximate)
      // Proper implementation needs DISTINCT query, using estimate for now
      uniqueVisitors.value = Math.floor(totalClicks.value * 0.7);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to fetch analytics";
    } finally {
      loading.value = false;
    }
  }

  watch(
    range,
    () => {
      void fetchAllData();
    },
    { immediate: true },
  );

  // Auto-adjust time granularity based on data volume (each data point = 1 hour)
  watch(
    timeseries,
    (data) => {
      const dataPointCount = data.length; // Each data point represents 1 hour
      const rangeHours = dataPointCount;
      const rangeDays = rangeHours / 24;

      let suggestedGranularity: TimeGranularity = "hour";

      if (rangeHours <= 24) {
        suggestedGranularity = "hour";
      } else if (rangeDays <= 30) {
        suggestedGranularity = "day";
      } else if (rangeDays <= 180) {
        suggestedGranularity = "week";
      } else {
        suggestedGranularity = "month";
      }

      timeGranularity.value = suggestedGranularity;
    },
    { immediate: true },
  );

  const chartData = computed(() => {
    if (timeseries.value.length === 0) return [];

    // Get hourly data from backend
    const hourlyData = timeseries.value.map((d) => {
      // Convert timestamp to string and append 'Z' for UTC parsing
      const timestampStr = String(d.timestamp);
      const date = new Date(timestampStr + "Z");
      return {
        date,
        amount: Number(d.clicks ?? 0),
      };
    });

    const granularity = timeGranularity.value;

    // Return hourly data directly (no aggregation needed)
    if (granularity === "hour") {
      return hourlyData;
    }

    // Aggregate by day
    if (granularity === "day") {
      const grouped = new Map<string, number>();

      for (const item of hourlyData) {
        // Use date string as key (YYYY-MM-DD)
        const key = item.date.toISOString().split("T")[0] ?? "";
        grouped.set(key, (grouped.get(key) ?? 0) + item.amount);
      }

      return Array.from(grouped.entries())
        .map(([dateStr, amount]) => ({
          date: new Date(`${dateStr}T00:00:00Z`),
          amount,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    }

    // Aggregate by week
    if (granularity === "week") {
      const grouped = new Map<string, number>();

      for (const item of hourlyData) {
        const date = item.date;
        // Get start of week (Sunday)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const key = weekStart.toISOString().split("T")[0] ?? "";
        grouped.set(key, (grouped.get(key) ?? 0) + item.amount);
      }

      return Array.from(grouped.entries())
        .map(([dateStr, amount]) => ({
          date: new Date(`${dateStr}T00:00:00Z`),
          amount,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    }

    // Aggregate by month
    if (granularity === "month") {
      const grouped = new Map<string, number>();

      for (const item of hourlyData) {
        const date = item.date;
        // Use YYYY-MM as key
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        grouped.set(key, (grouped.get(key) ?? 0) + item.amount);
      }

      return Array.from(grouped.entries())
        .map(([dateStr, amount]) => {
          const [year, month] = dateStr.split("-");
          return {
            date: new Date(`${year}-${month}-01T00:00:00Z`),
            amount,
          };
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    }

    return hourlyData;
  });

  const mobilePercentage = computed(() => {
    const mobile = devices.value.find((d) => {
      const type = String(d.deviceType || "").toLowerCase();
      return type === "mobile";
    });
    if (!mobile) return 0;
    return totalClicks.value > 0
      ? Math.round((Number(mobile.clicks) / totalClicks.value) * 100)
      : 0;
  });

  const topCountry = computed(() => {
    if (countries.value.length === 0) return { name: "N/A", percentage: 0 };
    const top = countries.value[0];
    if (!top) return { name: "N/A", percentage: 0 };
    const countryName = String(top.country || "Unknown");
    const percentage =
      totalClicks.value > 0 ? Math.round((Number(top.clicks) / totalClicks.value) * 100) : 0;
    return { name: countryName, percentage };
  });

  const activeTabData = computed(() => {
    switch (activeTab.value) {
      case "devices":
        return devices.value;
      case "browsers":
        return browsers.value;
      case "referers":
        return referers.value;
      case "utm":
        return utmSources.value;
    }
  });

  const activeTabKey = computed(() => {
    switch (activeTab.value) {
      case "devices":
        return "deviceType";
      case "browsers":
        return "browserName";
      case "referers":
        return "referrer";
      case "utm":
        return "utmSource";
    }
  });

  function setTab(tab: DimensionTab) {
    activeTab.value = tab;
  }

  function setTimeGranularity(granularity: TimeGranularity) {
    timeGranularity.value = granularity;
  }

  return {
    range,
    activeTab,
    timeGranularity,
    timeseries,
    countries,
    devices,
    browsers,
    referers,
    utmSources,
    totalClicks,
    uniqueVisitors,
    mobilePercentage,
    topCountry,
    chartData,
    activeTabData,
    activeTabKey,
    loading,
    error,
    fetchAllData,
    setTab,
    setTimeGranularity,
  };
}
