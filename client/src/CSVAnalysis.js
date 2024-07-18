import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CSVAnalysis = ({ csvContent }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (csvContent) {
      const parsedData = csvContent
        .split("\n")
        .slice(1) // Remove header
        .map((row) => {
          const [created_at, entry_id, distance, temperature, humidity] =
            row.split(",");
          return {
            created_at,
            temperature: parseFloat(temperature),
            humidity: parseFloat(humidity),
            distance: parseFloat(distance),
          };
        })
        .filter(
          (item) =>
            !isNaN(item.temperature) &&
            !isNaN(item.humidity) &&
            !isNaN(item.distance)
        );
      setData(parsedData);
    }
  }, [csvContent]);

  if (data.length === 0) {
    return <div>No data to display</div>;
  }

  return (
    <div>
      <h2>Data Analysis</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="created_at" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#8884d8"
            name="Temperature"
          />
          <Line
            type="monotone"
            dataKey="humidity"
            stroke="#82ca9d"
            name="Humidity"
          />
          <Line
            type="monotone"
            dataKey="distance"
            stroke="#ffc658"
            name="Distance"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CSVAnalysis;
