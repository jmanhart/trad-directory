import { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography, Marker, Annotation } from "react-simple-maps";
import { fetchTattooShopsWithArtists } from "../../services/api";
import { US_STATE_ABBREVIATIONS } from "../../utils/stateAbbreviations";
import styles from "./UnitedStatesMapPage.module.css";

// US States GeoJSON URL (using a public CDN)
const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// Approximate center coordinates for state labels
const stateLabels: Record<string, { coordinates: [number, number]; name: string }> = {
  AL: { coordinates: [-86.7911, 32.8067], name: "Alabama" },
  AK: { coordinates: [-152.4044, 61.3707], name: "Alaska" },
  AZ: { coordinates: [-111.4312, 34.0489], name: "Arizona" },
  AR: { coordinates: [-92.3731, 34.9697], name: "Arkansas" },
  CA: { coordinates: [-119.4179, 36.7783], name: "California" },
  CO: { coordinates: [-105.3111, 39.0598], name: "Colorado" },
  CT: { coordinates: [-72.7554, 41.5978], name: "Connecticut" },
  DE: { coordinates: [-75.5277, 39.3185], name: "Delaware" },
  FL: { coordinates: [-81.5158, 27.7663], name: "Florida" },
  GA: { coordinates: [-83.1132, 33.0406], name: "Georgia" },
  HI: { coordinates: [-157.4983, 21.0943], name: "Hawaii" },
  ID: { coordinates: [-114.4780, 44.2405], name: "Idaho" },
  IL: { coordinates: [-89.3985, 40.3495], name: "Illinois" },
  IN: { coordinates: [-86.1477, 39.8494], name: "Indiana" },
  IA: { coordinates: [-93.2105, 42.0115], name: "Iowa" },
  KS: { coordinates: [-98.4842, 38.5266], name: "Kansas" },
  KY: { coordinates: [-84.6701, 37.6681], name: "Kentucky" },
  LA: { coordinates: [-91.8749, 31.1695], name: "Louisiana" },
  ME: { coordinates: [-69.3977, 44.3235], name: "Maine" },
  MD: { coordinates: [-76.5019, 39.0639], name: "Maryland" },
  MA: { coordinates: [-71.5376, 42.2302], name: "Massachusetts" },
  MI: { coordinates: [-84.5467, 43.3266], name: "Michigan" },
  MN: { coordinates: [-94.6859, 45.6945], name: "Minnesota" },
  MS: { coordinates: [-89.6678, 32.7416], name: "Mississippi" },
  MO: { coordinates: [-92.1893, 38.4561], name: "Missouri" },
  MT: { coordinates: [-110.4544, 46.9219], name: "Montana" },
  NE: { coordinates: [-98.2681, 41.1254], name: "Nebraska" },
  NV: { coordinates: [-117.0554, 38.3135], name: "Nevada" },
  NH: { coordinates: [-71.5653, 43.4525], name: "New Hampshire" },
  NJ: { coordinates: [-74.5210, 40.2989], name: "New Jersey" },
  NM: { coordinates: [-106.2485, 34.8405], name: "New Mexico" },
  NY: { coordinates: [-74.9481, 42.1657], name: "New York" },
  NC: { coordinates: [-79.0193, 35.6301], name: "North Carolina" },
  ND: { coordinates: [-99.7840, 47.5289], name: "North Dakota" },
  OH: { coordinates: [-82.7649, 40.3888], name: "Ohio" },
  OK: { coordinates: [-97.0929, 35.5653], name: "Oklahoma" },
  OR: { coordinates: [-122.0709, 44.5720], name: "Oregon" },
  PA: { coordinates: [-77.2098, 40.5908], name: "Pennsylvania" },
  RI: { coordinates: [-71.5118, 41.6809], name: "Rhode Island" },
  SC: { coordinates: [-80.9450, 33.8569], name: "South Carolina" },
  SD: { coordinates: [-99.9018, 44.2998], name: "South Dakota" },
  TN: { coordinates: [-86.7844, 35.7478], name: "Tennessee" },
  TX: { coordinates: [-99.9018, 31.0545], name: "Texas" },
  UT: { coordinates: [-111.8926, 40.1500], name: "Utah" },
  VT: { coordinates: [-72.7317, 44.0459], name: "Vermont" },
  VA: { coordinates: [-78.1694, 37.7693], name: "Virginia" },
  WA: { coordinates: [-121.4900, 47.4009], name: "Washington" },
  WV: { coordinates: [-80.9696, 38.4912], name: "West Virginia" },
  WI: { coordinates: [-89.6165, 44.2685], name: "Wisconsin" },
  WY: { coordinates: [-107.3025, 42.7559], name: "Wyoming" },
};

// Map state names to state codes (handles variations)
function getStateCode(stateName: string | null | undefined): string | null {
  if (!stateName) return null;
  
  const normalized = stateName.trim();
  
  // Handle "United States" or "USA" - return null as it's not a state
  if (/^united states|^usa$/i.test(normalized)) return null;
  
  // Try exact match in US_STATE_ABBREVIATIONS
  if (US_STATE_ABBREVIATIONS[normalized]) {
    return US_STATE_ABBREVIATIONS[normalized];
  }
  
  // Try case-insensitive lookup
  const stateKey = Object.keys(US_STATE_ABBREVIATIONS).find(
    key => key.toLowerCase() === normalized.toLowerCase()
  );
  if (stateKey) {
    return US_STATE_ABBREVIATIONS[stateKey];
  }
  
  // Try to match by abbreviation already being the code (if it's already a 2-letter code)
  if (normalized.length === 2 && stateLabels[normalized.toUpperCase()]) {
    return normalized.toUpperCase();
  }
  
  return null;
}

export default function UnitedStatesMapPage() {
  const [stateArtistCounts, setStateArtistCounts] = useState<Map<string, number>>(new Map());
  const [hoveredState, setHoveredState] = useState<{ code: string; name: string; count: number } | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadArtists() {
      try {
        const artists = await fetchTattooShopsWithArtists();
        // Count artists per state (only USA states)
        const counts = new Map<string, number>();
        artists.forEach((artist) => {
          const country = artist.country_name?.toLowerCase().trim();
          const stateName = artist.state_name;
          
          // Check if it's a US state: either country is USA, or country is N/A but state maps to US state code
          const stateCode = getStateCode(stateName);
          if (stateCode) {
            // If we can map the state to a code, it's a US state
            // Include if: country is USA, OR country is N/A/missing (assume US if state is valid)
            const isUSA = country && /^united states|^usa|^u\.s\.|^u\.s\.a\./i.test(country);
            const countryMissing = !country || country === "n/a";
            
            if (isUSA || countryMissing) {
              counts.set(stateCode, (counts.get(stateCode) || 0) + 1);
            }
          }
        });
        setStateArtistCounts(counts);
      } catch (err) {
        console.error("Error loading artists:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadArtists();
  }, []);

  const getStateColor = (stateCode: string) => {
    return stateArtistCounts.has(stateCode) 
      ? "var(--color-primary)" 
      : "var(--gray-200)";
  };

  const getStateHoverColor = (stateCode: string) => {
    return stateArtistCounts.has(stateCode) 
      ? "var(--red-300)" 
      : "var(--gray-300)";
  };

  const handleMouseEnter = (stateCode: string, stateName: string, event: any) => {
    const count = stateArtistCounts.get(stateCode) || 0;
    if (count > 0) {
      setHoveredState({ code: stateCode, name: stateName, count });
      // Get mouse position from the event
      const mouseEvent = event.nativeEvent || event;
      setMousePosition({ 
        x: mouseEvent.clientX || 0, 
        y: mouseEvent.clientY || 0 
      });
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (hoveredState) {
      setMousePosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseLeave = () => {
    setHoveredState(null);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>US States Map - Artists</h1>
      {isLoading && <p className={styles.loading}>Loading artist data...</p>}
      <div 
        className={styles.mapContainer}
        onMouseMove={handleMouseMove}
      >
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{
            scale: 1000,
            center: [0, 0],
          }}
          width={800}
          height={500}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // us-atlas uses the state name as the property value
                // The property object has one key-value pair where value is the state name
                const props = geo.properties || {};
                const stateName = Object.values(props)[0] as string | undefined;
                // Map state name to code
                const stateCode = stateName ? getStateCode(stateName) : null;
                const hasArtists = stateCode ? stateArtistCounts.has(stateCode) : false;
                const fillColor = hasArtists 
                  ? "var(--color-primary)" 
                  : "var(--gray-200)";
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillColor}
                    stroke="var(--color-surface)"
                    strokeWidth={0.5}
                    onMouseEnter={(event) => {
                      if (stateCode && stateName) {
                        const count = stateArtistCounts.get(stateCode) || 0;
                        if (count > 0) {
                          setHoveredState({ code: stateCode, name: stateName, count });
                        }
                      }
                    }}
                    onMouseLeave={() => setHoveredState(null)}
                    style={{
                      default: {
                        fill: fillColor,
                        outline: "none",
                      },
                      hover: {
                        fill: hasArtists ? "var(--red-300)" : "var(--gray-300)",
                        outline: "none",
                        cursor: hasArtists ? "pointer" : "default",
                      },
                      pressed: {
                        fill: hasArtists ? "var(--red-400)" : "var(--gray-400)",
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
          {Object.entries(stateLabels).map(([code, { coordinates, name }]) => (
            <Annotation
              key={code}
              subject={coordinates}
              dx={0}
              dy={0}
            >
              <text
                textAnchor="middle"
                style={{
                  fontFamily: "system-ui, sans-serif",
                  fill: "var(--color-text-primary)",
                  fontSize: "10px",
                  fontWeight: 500,
                  pointerEvents: "none",
                }}
              >
                {code}
              </text>
            </Annotation>
          ))}
        </ComposableMap>
        {hoveredState && (
          <div
            className={styles.tooltip}
            style={{
              left: `${mousePosition.x + 10}px`,
              top: `${mousePosition.y + 10}px`,
            }}
          >
            <div className={styles.tooltipState}>{hoveredState.name}</div>
            <div className={styles.tooltipCount}>
              {hoveredState.count} {hoveredState.count === 1 ? "artist" : "artists"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
