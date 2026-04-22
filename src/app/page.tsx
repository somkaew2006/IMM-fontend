"use client";

import React from "react";
import { Card, Col, Row, Statistic, Button, Input, Form as AntForm, Typography } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined, AccountBookOutlined, TeamOutlined, RiseOutlined, DashboardOutlined } from "@ant-design/icons";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const { Text, Title } = Typography;

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
    cell: (info) => <span className="font-semibold text-teal-600">{info.getValue()}</span>,
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
      let colorClass = "bg-slate-100 text-slate-600";
      if (val === "Active") colorClass = "bg-green-100 text-green-700";
      if (val === "Pending") colorClass = "bg-amber-100 text-amber-700";
      if (val === "Completed") colorClass = "bg-teal-100 text-teal-700";
      return (
         <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>
           {val}
         </span>
      );
    },
  }),
];

export default function Dashboard() {
  const table = useReactTable({
    data: defaultData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
  };

  return (
    <div className="space-y-8">
      {/* Page Header (Matching the image) */}
      <div className="header-gradient rounded-[2.5rem] p-10 mb-10 shadow-xl shadow-teal-500/10 relative overflow-hidden">
         <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
         <div className="absolute bottom-[-30px] left-[10%] w-32 h-32 bg-teal-300/20 rounded-full blur-2xl"></div>
         
         <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
               <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white/60 mb-2">
                     <DashboardOutlined />
                     <Text className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Live Monitoring</Text>
                  </div>
                  <Title level={1} className="m-0 text-white font-black antialiased tracking-tight" style={{ color: 'white', margin: 0 }}>Analytics Dashboard</Title>
                  <Text className="text-teal-100/70 text-sm font-medium">Enterprise Resource Planning & Performance Tracking</Text>
               </div>
               <div className="flex gap-3">
                  <Button className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl h-11 px-6 font-bold text-xs uppercase tracking-widest">Filter Area</Button>
                  <Button className="bg-white text-teal-600 border-none hover:bg-teal-50 rounded-xl h-11 px-6 font-bold text-xs uppercase tracking-widest shadow-lg shadow-teal-900/10">Generate Report</Button>
               </div>
            </div>
         </div>
      </div>

      {/* KPI Stats */}
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card variant="borderless" className="modern-card">
            <Statistic
              title={<div className="flex items-center gap-2 mb-1"><AccountBookOutlined className="text-teal-500" /> <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-none">Total Revenue</span></div>}
              value={112893}
              precision={1}
              valueStyle={{ color: '#0d9488', fontWeight: 900, fontSize: '1.8rem' }}
              prefix={<ArrowUpOutlined className="text-[#10b981] text-sm" />}
              suffix={<span className="text-[10px] text-slate-400 font-normal ml-1">THB</span>}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card variant="borderless" className="modern-card">
            <Statistic
              title={<div className="flex items-center gap-2 mb-1"><TeamOutlined className="text-teal-400" /> <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-none">Global Clients</span></div>}
              value={248}
              valueStyle={{ color: '#115e59', fontWeight: 900, fontSize: '1.8rem' }}
              suffix={<span className="text-[10px] text-slate-400 font-normal ml-1">Entities</span>}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card variant="borderless" className="modern-card">
            <Statistic
              title={<div className="flex items-center gap-2 mb-1"><RiseOutlined className="text-emerald-500" /> <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-none">Profit Margin</span></div>}
              value={19.4}
              precision={1}
              valueStyle={{ color: '#064e3b', fontWeight: 900, fontSize: '1.8rem' }}
              prefix={<ArrowUpOutlined className="text-[#10b981] text-sm" />}
              suffix={<span className="text-[10px] text-slate-400 font-normal ml-1">% Rate</span>}
            />
          </Card>
        </Col>
      </Row>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card 
            title={<span className="text-slate-700 font-bold flex items-center gap-2"><Text type="secondary" className="text-xs">01.</Text> Master Analytics</span>} 
            variant="borderless" 
            className="modern-card overflow-hidden" 
            styles={{ body: { padding: 0 } }}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-slate-600">
                <thead className="text-[10px] text-slate-400 uppercase tracking-widest bg-slate-50/50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="px-6 py-4 font-black">
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
                <tbody className="divide-y divide-slate-100">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-teal-50/30 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-5">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50/50 text-center">
               <Button type="link" className="text-[10px] font-bold uppercase tracking-widest text-teal-600">View Comprehensive Report</Button>
            </div>
          </Card>
        </div>

        <div>
          <Card 
            title={<span className="text-slate-700 font-bold flex items-center gap-2"><Text type="secondary" className="text-xs">02.</Text> Live Input</span>} 
            variant="borderless" 
            className="modern-card"
          >
            <AntForm layout="vertical" onFinish={handleSubmit(onSubmit)}>
              <AntForm.Item
                label={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Name</span>}
                validateStatus={errors.customerName ? "error" : ""}
                help={errors.customerName?.message}
                className="mb-4"
              >
                <Controller
                  name="customerName"
                  control={control}
                  render={({ field }) => <Input {...field} className="rounded-xl h-11 bg-slate-50 border-slate-100" placeholder="Enter full name" />}
                />
              </AntForm.Item>

              <AntForm.Item
                label={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Booking Category</span>}
                validateStatus={errors.bookingType ? "error" : ""}
                help={errors.bookingType?.message}
                className="mb-4"
              >
                <Controller
                  name="bookingType"
                  control={control}
                  render={({ field }) => <Input {...field} className="rounded-xl h-11 bg-slate-50 border-slate-100" placeholder="Operational Type" />}
                />
              </AntForm.Item>

              <AntForm.Item
                label={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transaction Amount</span>}
                validateStatus={errors.amount ? "error" : ""}
                help={errors.amount?.message}
                className="mb-6"
              >
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      className="rounded-xl h-11 bg-slate-50 border-slate-100"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      prefix={<span className="text-slate-300">฿</span>}
                      placeholder="0.00"
                    />
                  )}
                />
              </AntForm.Item>

              <Button type="primary" htmlType="submit" block className="rounded-2xl h-14 bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-100 font-bold text-sm tracking-wide border-none">
                Initialize Booking
              </Button>
            </AntForm>
          </Card>
        </div>
      </div>
    </div>
  );
}
