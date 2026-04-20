"use client";

import React, { useEffect, useState } from "react";
import { Card, Table, Tag, Typography, Button, Space, message, Spin, Input } from "antd";
import { ReloadOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import Link from "next/link";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { fetchBookings } from "@/lib/api";

const { Title } = Typography;

// --- Types ---
type BookingDetail = {
  bookingDetailId: number;
  itemDescription: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type Booking = {
  bookingId: number;
  bookingNo: string;
  bookingDate: string;
  status: string;
  customerName: string;
  vesselName: string;
  mainVesselLoa: number | string;
  beam: number | string;
  draft: number | string;
  arrivalDate?: string;
  departureDate?: string;
  arrival_date?: string;
  departure_date?: string;
  grandTotal: string | number;
  createdAt: string;
  details: BookingDetail[];
};

export default function BookingPage() {
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchBookings();
      setData(result);
    } catch (error) {
      console.error(error);
      message.error("Failed to load bookings. Make sure backend is running at http://localhost:3001");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- TanStack Table Setup ---
  const columnHelper = createColumnHelper<Booking>();
  const columns = [
    columnHelper.accessor("bookingNo", {
      header: "Booking Information",
      cell: (info) => (
        <div className="flex flex-col">
          <Link href={`/booking/${info.row.original.bookingId}`}>
            <span className="font-semibold text-blue-600 font-mono hover:underline cursor-pointer">
              {info.getValue()}
            </span>
          </Link>
          <span className="text-xs text-gray-500 mt-1">
            Date: {new Date(info.row.original.bookingDate).toLocaleDateString("th-TH")}
          </span>
        </div>
      ),
    }),
    columnHelper.accessor("customerName", {
      header: "Customer",
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor("vesselName", {
      header: "Vessel Information",
      cell: (info) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{info.getValue() || "N/A"}</span>
          <div className="flex gap-2 text-xs text-gray-500 mt-1">
            <span>L: {info.row.original.mainVesselLoa || 0}m</span>
            <span>B: {info.row.original.beam || 0}m</span>
            <span>D: {info.row.original.draft || 0}m</span>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor((row) => row.arrivalDate || row.arrival_date, {
      id: "arrivalDate",
      header: "Arrival Date",
      cell: (info) => {
        const val = info.getValue();
        return val ? new Date(val).toLocaleDateString("th-TH") : "-";
      },
    }),
    columnHelper.accessor((row) => row.departureDate || row.departure_date, {
      id: "departureDate",
      header: "Departure Date",
      cell: (info) => {
        const val = info.getValue();
        return val ? new Date(val).toLocaleDateString("th-TH") : "-";
      },
    }),
    columnHelper.accessor("grandTotal", {
      header: "Grand Total",
      cell: (info) => {
        const value = info.getValue();
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat("th-TH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(numValue || 0);
      },
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => {
        const val = info.getValue()?.toLowerCase();
        let color = "default";
        if (val === "active" || val === "confirmed") color = "success";
        if (val === "draft") color = "processing";
        if (val === "pending") color = "warning";
        return <Tag color={color} className="uppercase font-medium">{val || "UNKNOWN"}</Tag>;
      },
    }),

    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: () => (
        <Space size="middle">
          <Button type="link" size="small">Edit</Button>
          <Button type="link" size="small" danger>Delete</Button>
        </Space>
      ),
    }),
  ];

  const filteredData = data.filter((item) => {
    const search = searchTerm.toLowerCase();
    return (
      item.bookingNo?.toLowerCase().includes(search) ||
      item.customerName?.toLowerCase().includes(search) ||
      item.vesselName?.toLowerCase().includes(search)
    );
  });

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center">
          <Title level={2} className="m-0">Booking List</Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
              Refresh
            </Button>
            <Link href="/booking/create">
              <Button type="primary" icon={<PlusOutlined />} className="bg-[#1677ff]">
                New Booking
              </Button>
            </Link>
          </Space>
        </div>
      </div>
        
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <Input 
          placeholder="Search Booking No, Customer, or Vessel..." 
          prefix={<SearchOutlined className="text-gray-400" />}
          className="w-full max-w-lg"
          allowClear
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card variant="borderless" className="shadow-sm">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" description="Loading bookings..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-600 border-collapse">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-6 py-4 font-bold">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100">
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-10 text-center text-gray-400">
                      No bookings found. Start by creating a new one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
