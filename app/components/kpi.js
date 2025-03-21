import { usePathname } from "next/navigation";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { useTrack } from "./context/TrackContext";
import "../styles.css";

export function KPI() {
    const pathname = usePathname();
    const { selectedTrack, tripCounts } = useTrack(); // Get selected track ID and tripCounts

    // Get the trip count for the selected track, default to 0
    const gaugeValue = selectedTrack ? tripCounts[selectedTrack] || 0 : 0;

    return (
        <div className="size-full flex flex-col">
            {!pathname.includes("/stats") && <h1 className="int_label whitespace-nowrap text-left">Capacity %</h1>}
            <div className="size-full content_background flex flex-col">
                <Gauge
                    value={gaugeValue}
                    valueMax={100}  // Adjust this based on typical max trip count
                    startAngle={-90}
                    endAngle={90}
                    cornerRadius="50%"
                    sx={{
                        [`& .${gaugeClasses.valueText}`]: { fontSize: 16 },
                        [`& .${gaugeClasses.valueArc}`]: { fill: '#ffffff' },
                    }}
                />
                {selectedTrack && <p className="mt-2 text-white">Selected Track: {selectedTrack}</p>}
            </div>
        </div>
    );
}
