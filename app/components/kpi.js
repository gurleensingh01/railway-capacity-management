import { usePathname } from "next/navigation";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";

import "../styles.css";

export function KPI() {
    const pathname = usePathname();
    var isRouteOnExpandedPage = (pathname === "/stats");
    return (
        <>
            <div className="h-full w-full flex flex-row space-x-4 justify-stretch">
                <div className="h-full w-full flex flex-col justify-center text-center">
                    { !isRouteOnExpandedPage &&
                        <h1 className="text-xl font-bold text-left pl-1 mb-2">Capacity %</h1>
                    }
                    <div className="content_background h-full w-full flex flex-col justify-center text-center">
                        <Gauge
                            height={150}
                            value={60}
                            valueMax={100}
                            startAngle={-90}
                            endAngle={90}
                            cornerRadius="50%"
                            sx={(theme) => ({
                                [`& .${gaugeClasses.valueText}`]: {
                                    fontSize: 16,
                                },
                                [`& .${gaugeClasses.valueText} text`]: {
                                    fill: "#ffffff",
                                },
                                [`& .${gaugeClasses.valueArc}`]: {
                                    fill: '#ffffff',
                                },
                                [`& .${gaugeClasses.referenceArc}`]: {
                                    fill: theme.palette.text.disabled,
                                },
                            })}
                        />
                    </div>
                </div>
                <div className="h-full w-full flex flex-col justify-center text-center">
                    { !isRouteOnExpandedPage &&
                        <h1 className="text-xl font-bold text-left pl-1 mb-2">Delays</h1>
                    }
                    <div className="content_background h-full w-full flex flex-col justify-center text-center">
                        <PieChart
                            height={200}
                            colors={['#ffffff', '#000000', '#a0a0a0']}
                            series={[
                                {
                                    data: [
                                        { id: 0, value: 80, label: 'On-Time' },
                                        { id: 1, value: 15, label: '< 5 mins' },
                                        { id: 2, value: 5, label: '> 5 mins' },
                                    ],
                                },
                            ]}
                        />
                    </div>
                </div>
                <div className="h-full w-full flex flex-col justify-center text-center">
                    { !isRouteOnExpandedPage &&
                        <h1 className="text-xl font-bold text-left pl-1 mb-2">Complaints</h1>
                    }
                    <div className="content_background h-full w-full flex flex-col justify-center text-center">
                        <BarChart
                            height={200}
                            xAxis={[{
                                scaleType: 'band',
                                data: [
                                    'jan',
                                    'feb',
                                    'mar',
                                    'apr',
                                    'may',
                                    'jun',
                                    'jul',
                                    'aug',
                                    'sep',
                                    'oct',
                                    'nov',
                                    'dec',
                                ]
                            }]}
                            series={[
                                { data: [1, 2, 4, 5, 8, 1, 0, 2, 4, 6, 3, 2] },
                            ]}
                            colors={['#ffffff']}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
