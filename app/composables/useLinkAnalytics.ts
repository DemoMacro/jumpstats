type DimensionTab = "devices" | "browsers" | "referers" | "utm";

interface Range {
  start: Date;
  end: Date;
}

type TimeseriesData = {
  timestamp: string;
  clicks: string;
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

  const chartData = computed(() => {
    return timeseries.value.map((d) => {
      // Parse ClickHouse datetime format: 'YYYY-MM-DD HH:mm:ss'
      if (!d.timestamp) {
        return { date: new Date(), amount: Number(d.clicks ?? 0) };
      }

      const parts = d.timestamp.split(" ");
      if (parts.length !== 2) {
        return { date: new Date(), amount: Number(d.clicks ?? 0) };
      }

      const datePart = parts[0] ?? "";
      const timePart = parts[1] ?? "";
      const dateNumbers = datePart.split("-").map(Number);
      const timeNumbers = timePart.split(":").map(Number);

      if (dateNumbers.length !== 3 || timeNumbers.length !== 3) {
        return { date: new Date(), amount: Number(d.clicks ?? 0) };
      }

      const [year = 0, month = 1, day = 1] = dateNumbers;
      const [hour = 0, minute = 0, second = 0] = timeNumbers;

      return {
        date: new Date(year, month - 1, day, hour, minute, second),
        amount: Number(d.clicks ?? 0),
      };
    });
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

  return {
    range,
    activeTab,
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
  };
}
