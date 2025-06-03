import { useState } from "react";
import { Search, Car, Package, FileDown, Loader2, MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  fetchVehicleByVin,
  fetchPartsByVin,
  fetchVehiclesByPartNumber,
  fetchPartsByPartNumber,
  downloadInventoryReport,
} from "@/lib/api";

/* ──────────────────────────────────────────────
 *  Types
 * ──────────────────────────────────────────── */
interface VehicleSearchResult {
  type: "vehicle";
  data: any;
}

interface VinPartsSearchResult {
  type: "parts";
  data: any[];
}

interface VehiclesByPartSearchResult {
  type: "vehicles";
  data: any[];
}

interface FullPartSearchResult {
  type: "partFull";
  vehicles: any[];
  parts: any[];
  locations: string[]; // distinct list of locations
}

type SearchResult =
  | VehicleSearchResult
  | VinPartsSearchResult
  | VehiclesByPartSearchResult
  | FullPartSearchResult;

/* ──────────────────────────────────────────────
 *  Component
 * ──────────────────────────────────────────── */
export default function SearchPage() {
  const [vinSearch, setVinSearch] = useState("");
  const [partSearch, setPartSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ──────────────────────────── VIN SEARCH */
  const handleVinSearch = async () => {
    if (!vinSearch.trim()) return;

    setIsSearching(true);
    setError(null);
    setSearchResults(null);

    try {
      const vehicleResult = await fetchVehicleByVin(vinSearch);
      if (vehicleResult.success) {
        setSearchResults({ type: "vehicle", data: vehicleResult.data });
      } else {
        setError(vehicleResult.error || "Vehicle not found");
      }
    } catch {
      setError("An error occurred while searching for the vehicle");
    } finally {
      setIsSearching(false);
    }
  };

  const handleVinPartsSearch = async () => {
    if (!vinSearch.trim()) return;

    setIsSearching(true);
    setError(null);
    setSearchResults(null);

    try {
      const partsResult = await fetchPartsByVin(vinSearch);
      if (partsResult.success) {
        setSearchResults({ type: "parts", data: partsResult.data });
      } else {
        setError(partsResult.error || "No parts found for this VIN");
      }
    } catch {
      setError("An error occurred while searching for parts");
    } finally {
      setIsSearching(false);
    }
  };

  /* ───────────────────────── PART-NUMBER SEARCH */
  const handlePartSearch = async () => {
    if (!partSearch.trim()) return;

    setIsSearching(true);
    setError(null);
    setSearchResults(null);

    try {
      // fire requests in parallel
      const [vehiclesResult, partsResult] = await Promise.all([
        fetchVehiclesByPartNumber(partSearch),
        fetchPartsByPartNumber(partSearch),
      ]);

      const vehicles = vehiclesResult.success ? vehiclesResult.data : [];
      const parts = partsResult.success ? partsResult.data : [];

      if (vehicles.length === 0 && parts.length === 0) {
        setError("No data found for this part number");
      } else {
        // collect distinct locations
        const locations = Array.from(
          new Set(parts.map((p: any) => p.location).filter(Boolean))
        );

        setSearchResults({
          type: "partFull",
          vehicles,
          parts,
          locations: locations as string[],
        });
      }
    } catch {
      setError("An error occurred while searching for vehicles and parts");
    } finally {
      setIsSearching(false);
    }
  };

  /* ───────────────────────── REPORT DOWNLOAD */
  const handleDownloadReport = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      const result = await downloadInventoryReport();
      if (!result.success) {
        setError(result.error || "Failed to download report");
      }
    } catch {
      setError("An error occurred while downloading the report");
    } finally {
      setIsDownloading(false);
    }
  };

  /* ──────────────────────────── RENDER HELPERS */
  const renderVehicleResult = (vehicle: any) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Vehicle Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 overflow-x-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(
            [
              { label: "VIN", value: vehicle.vin },
              { label: "Make", value: vehicle.make },
              { label: "Model", value: vehicle.model },
              { label: "Year", value: vehicle.year },
            ] as const
          ).map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <p
                className={`text-xs sm:text-sm ${
                  label === "VIN" ? "font-mono break-all" : ""
                }`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
        {vehicle.trim && (
          <div>
            <Label className="text-xs text-muted-foreground">Trim</Label>
            <p className="text-xs sm:text-sm">{vehicle.trim}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderPartsResult = (parts: any[]) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Parts Found ({parts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 overflow-x-auto">
        {parts.map((part, idx) => (
          <div key={idx} className="p-3 border rounded-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-mono break-all text-xs sm:text-sm">
                  {part.part_number}
                </p>
                {part.part_description && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                    {part.part_description}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-all">
                  Location: {part.location}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 text-xs">
                {part.status || "In Stock"}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderVehiclesResult = (vehicles: any[]) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Vehicles Found ({vehicles.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 overflow-x-auto">
        {vehicles.map((v, idx) => (
          <div key={idx} className="p-3 border rounded-lg">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
              {(
                [
                  { label: "VIN", value: v.vin, mono: true },
                  { label: "Make", value: v.make, mono: false },
                  { label: "Model", value: v.model, mono: false },
                  { label: "Year", value: v.year, mono: false },
                ] as const
              ).map(({ label, value, mono }) => (
                <div key={label} className="min-w-0">
                  <Label className="text-[11px] text-muted-foreground">
                    {label}
                  </Label>
                  <p
                    className={`${mono ? "font-mono break-all" : ""} truncate`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  /* Renders distinct location list */
  const renderLocationsResult = (locations: string[]) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Locations ({locations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {locations.map((loc) => (
            <Badge
              key={loc}
              variant="secondary"
              className="text-xs sm:text-sm px-3 py-1 break-all"
            >
              {loc}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  /* ──────────────────────────── UI  */
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Inventory Search
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            Search by VIN or part number to find vehicles and parts in your
            inventory
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="vin" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vin">VIN Search</TabsTrigger>
            <TabsTrigger value="part">Part Search</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* VIN TAB */}
          <TabsContent value="vin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search by VIN</CardTitle>
                <CardDescription>
                  Enter a VIN to find vehicle details or associated parts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vin">Vehicle Identification Number</Label>
                  <Input
                    id="vin"
                    placeholder="Enter 17-character VIN"
                    value={vinSearch}
                    onChange={(e) =>
                      setVinSearch(e.target.value.toUpperCase())
                    }
                    maxLength={17}
                    className="font-mono"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleVinSearch}
                    disabled={isSearching || !vinSearch.trim()}
                    className="flex-1"
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Find Vehicle
                  </Button>
                  <Button
                    onClick={handleVinPartsSearch}
                    disabled={isSearching || !vinSearch.trim()}
                    variant="outline"
                    className="flex-1"
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Package className="h-4 w-4 mr-2" />
                    )}
                    Find Parts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PART TAB */}
          <TabsContent value="part" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search by Part Number</CardTitle>
                <CardDescription>
                  Enter a part number to find all vehicles and part entries for
                  it
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="part">Part Number</Label>
                  <Input
                    id="part"
                    placeholder="Enter part number"
                    value={partSearch}
                    onChange={(e) =>
                      setPartSearch(e.target.value.toUpperCase())
                    }
                    className="font-mono"
                  />
                </div>
                <Button
                  onClick={handlePartSearch}
                  disabled={isSearching || !partSearch.trim()}
                  className="w-full"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Search
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* REPORTS TAB */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Reports</CardTitle>
                <CardDescription>
                  Download comprehensive inventory reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleDownloadReport}
                  disabled={isDownloading}
                  className="w-full"
                  size="lg"
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4 mr-2" />
                  )}
                  Download Inventory Excel Report
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ERROR */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* RESULTS */}
        {searchResults && (
          <div className="space-y-4">
            {searchResults.type === "vehicle" &&
              renderVehicleResult(searchResults.data)}

            {searchResults.type === "parts" &&
              renderPartsResult(searchResults.data)}

            {searchResults.type === "vehicles" &&
              renderVehiclesResult(searchResults.data)}

            {searchResults.type === "partFull" && (
              <>
                {searchResults.parts.length > 0 &&
                  renderPartsResult(searchResults.parts)}

                {/* location card */}
                {searchResults.locations.length > 0 &&
                  renderLocationsResult(searchResults.locations)}

                {searchResults.vehicles.length > 0 &&
                  renderVehiclesResult(searchResults.vehicles)}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


