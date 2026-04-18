"use client";

import React from "react";
import { Card, Col, Row, Statistic, Button, Input, Form as AntForm } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// --- Zod Schema & Form Types ---
const bookingSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  bookingType: z.string().min(1, "Booking type is required"),
  amount: z.number().positive("Amount must be positive"),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

// --- TanStack Table Setup ---
type Booking = {
  id: string;
  customerName: string;
  amount: number;
  status: string;
};

const defaultData: Booking[] = [
  { id: "B-1001", customerName: "Acme Corp", amount: 15400.0, status: "Active" },
  { id: "B-1002", customerName: "Global Tech", amount: 3200.5, status: "Completed" },
  { id: "B-1003", customerName: "Stark Ind.", amount: 950.0, status: "Pending" },
];

const columnHelper = createColumnHelper<Booking>();
const columns = [
  columnHelper.accessor("id", {
    header: "Booking ID",
    cell: (info) => <span className="font-semibold text-blue-600">{info.getValue()}</span>,
  }),
  columnHelper.accessor("customerName", {
    header: "Customer",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("amount", {
    header: "Amount (THB)",
    cell: (info) => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(info.getValue()),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const val = info.getValue();
      let colorClass = "bg-gray-100 text-gray-800";
      if (val === "Active") colorClass = "bg-green-100 text-green-800";
      if (val === "Pending") colorClass = "bg-yellow-100 text-yellow-800";
      if (val === "Completed") colorClass = "bg-blue-100 text-blue-800";
      return (
         <span className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
           {val}
         </span>
      );
    },
  }),
];

export default function Dashboard() {
  // TanStack Table Instance
  const table = useReactTable({
    data: defaultData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // React Hook Form Instance
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: "",
      bookingType: "",
      amount: 0,
    },
  });

  const onSubmit = (data: BookingFormValues) => {
    console.log("Form Submitted:", data);
    alert(`Success: ${data.customerName} - ${data.amount}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <Button type="primary">Create Report</Button>
      </div>

      {/* KPI Stats - AdminLTE Style Cards */}
      <Row gutter={16}>
        <Col span={8}>
          <Card variant="borderless" className="shadow-sm">
            <Statistic
              title="Total Sales"
              value={112893}
              precision={2}
              styles={{ content: { color: "#3f8600" } }}
              prefix={<ArrowUpOutlined />}
              suffix="THB"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card variant="borderless" className="shadow-sm">
            <Statistic
              title="Active Bookings"
              value={45}
              styles={{ content: { color: "#1677ff" } }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card variant="borderless" className="shadow-sm">
            <Statistic
              title="Idle Resources"
              value={9.3}
              precision={2}
              styles={{ content: { color: "#cf1322" } }}
              prefix={<ArrowDownOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TanStack Table Example */}
        <div className="lg:col-span-2">
          <Card title="Recent Bookings (TanStack Table)" variant="borderless" className="shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="px-4 py-3">
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
                <tbody className="divide-y">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* React Hook Form Example */}
        <div>
          <Card title="Quick Create (React Hook Form + Zod)" variant="borderless" className="shadow-sm">
            <AntForm layout="vertical" onFinish={handleSubmit(onSubmit)}>
              <AntForm.Item
                label="Customer Name"
                validateStatus={errors.customerName ? "error" : ""}
                help={errors.customerName?.message}
              >
                <Controller
                  name="customerName"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="Enter name" />}
                />
              </AntForm.Item>

              <AntForm.Item
                label="Booking Type"
                validateStatus={errors.bookingType ? "error" : ""}
                help={errors.bookingType?.message}
              >
                <Controller
                  name="bookingType"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="Vessel, Facility, etc." />}
                />
              </AntForm.Item>

              <AntForm.Item
                label="Amount (Real-time Validated)"
                validateStatus={errors.amount ? "error" : ""}
                help={errors.amount?.message}
              >
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      placeholder="Pricing"
                    />
                  )}
                />
              </AntForm.Item>

              <Button type="primary" htmlType="submit" className="w-full bg-[#1677ff]">
                Submit Booking
              </Button>
            </AntForm>
          </Card>
        </div>
      </div>
    </div>
  );
}
