"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Typography,
  Button,
  Space,
  message,
  Spin,
  Input,
  Tooltip
} from "antd";
import {
  ReloadOutlined,
  PlusOutlined,
  SearchOutlined,
  CompassOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
  UserOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchBookings } from "@/lib/api";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  FileExcelOutlined, 
  FilePdfOutlined 
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface Booking {
  bookingId: number;
  bookingNo: string;
  bookingDate: string;
  status: string;
  customerName: string;
  vesselName: string;
  mainVesselLoa: number;
  beam: number;
  draft: number;
  arrivalDate?: string;
  departureDate?: string;
  stayType?: string;
  grandTotal: number;
}

export default function BookingPage() {
  const router = useRouter();
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchBookings();
      setData(result);
    } catch (error) {
      message.error("Failed to sync booking data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredData = data.filter(item =>
    item.bookingNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vesselName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: "Booking No",
      dataIndex: "bookingNo",
      key: "bookingNo",
      width: 160,
      render: (text: string, record: Booking) => (
        <div className="flex flex-col py-0.5">
          <Text strong className="text-teal-600 font-mono hover:text-teal-500 cursor-pointer">
            {text}
          </Text>
          <Text className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1  tracking-wide">
            <CalendarOutlined style={{ fontSize: '9px' }} />
            {dayjs(record.bookingDate).format("DD/MM/YYYY")}
          </Text>
        </div>
      )
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      render: (text: string) => (
        <Space size={8}>
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
            <UserOutlined className="text-[10px] text-slate-400" />
          </div>
          <Text className="text-slate-700 font-medium">{text || "Walk-in"}</Text>
        </Space>
      )
    },
    {
      title: "Vessel",
      key: "vessel",
      render: (_: any, record: Booking) => (
        <div className="flex flex-col">
          <Space size={6}>
            <CompassOutlined className="text-teal-300" />
            <Text className="text-slate-700 font-medium">{record.vesselName || "N/A"}</Text>
          </Space>
          <div className="flex gap-4 mt-1.5 pl-5">
            <div className="flex flex-col">
              <Text className="text-xs text-slate-500">L:{record.mainVesselLoa || 0}</Text>
            </div>
            <div className="flex flex-col">
              <Text className="text-xs text-slate-500">B:{record.beam || 0}</Text>
            </div>
            <div className="flex flex-col">
              <Text className="text-xs text-slate-500">D:{record.draft || 0}</Text>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Stay Period",
      key: "period",
      width: 130,
      render: (_: any, record: Booking) => (
        <div className="flex flex-col gap-0.5">
          <Text className="text-xs text-slate-600 font-medium whitespace-nowrap">
            {record.arrivalDate ? dayjs(record.arrivalDate).format("DD/MM/YYYY") : "-"}
          </Text>
          <Text className="text-xs text-slate-400 font-medium whitespace-nowrap">
            - {record.departureDate ? dayjs(record.departureDate).format("DD/MM/YYYY") : "-"}
          </Text>
        </div>
      )
    },
    {
      title: "Stay Type",
      dataIndex: "stayType",
      key: "stayType",
      width: 100,
      render: (val: string) => (
        <Tag color={val === 'monthly' ? 'teal' : 'cyan'} className="m-0 border-none px-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
          {val || 'Daily'}
        </Tag>
      )
    },
    {
      title: "Grand Total",
      dataIndex: "grandTotal",
      key: "grandTotal",
      align: "right" as const,
      render: (val: number) => (
        <div className="flex flex-col items-end">
          <Text strong className="text-sm text-slate-800">
            {new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2 }).format(val || 0)}
          </Text>
        </div>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center" as const,
      render: (val: string) => {
        const status = val?.toLowerCase();
        let color = "default";
        if (status === "active" || status === "confirmed") color = "success";
        if (status === "draft") color = "processing";
        return (
          <Tag color={color} className="rounded-full px-3 py-0 text-[10px] font-bold  border-none tracking-wide">
            {val || "UNKNOWN"}
          </Tag>
        );
      }
    }
  ];

  const handleExportExcel = () => {
    const exportData = filteredData.map(item => ({
      "Booking No": item.bookingNo,
      "Date": dayjs(item.bookingDate).format("DD/MM/YYYY"),
      "Customer": item.customerName || "Walk-in",
      "Vessel": item.vesselName || "N/A",
      "LOA": item.mainVesselLoa || 0,
      "Beam": item.beam || 0,
      "Draft": item.draft || 0,
      "Arrival": item.arrivalDate ? dayjs(item.arrivalDate).format("DD/MM/YYYY") : "-",
      "Departure": item.departureDate ? dayjs(item.departureDate).format("DD/MM/YYYY") : "-",
      "Stay Type": item.stayType || "Daily",
      "Grand Total": item.grandTotal || 0,
      "Status": item.status
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    XLSX.writeFile(wb, `Booking_List_${dayjs().format("YYYYMMDD_HHmm")}.xlsx`);
    message.success("Exported to Excel successfully");
  };

  const handleExportPDF = () => {
    const tableData = filteredData.map(item => [
      item.bookingNo,
      dayjs(item.bookingDate).format("DD/MM/YYYY"),
      item.customerName || "Walk-in",
      item.vesselName || "N/A",
      item.arrivalDate ? dayjs(item.arrivalDate).format("DD/MM/YYYY") : "-",
      item.stayType || "Daily",
      new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2 }).format(item.grandTotal || 0),
      item.status
    ]);

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text("Booking List", 14, 15);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Generated on: ${dayjs().format("DD/MM/YYYY HH:mm")}`, 14, 22);
    doc.text(`Total Records: ${tableData.length}`, 14, 27);

    autoTable(doc, {
      startY: 32,
      head: [["Booking No", "Date", "Customer", "Vessel", "Arrival", "Type", "Total", "Status"]],
      body: tableData,
      theme: "striped",
      headStyles: { 
        fillColor: [38, 166, 154], // Teal-500
        textColor: 255, 
        fontSize: 10, 
        halign: 'center',
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 3,
        font: 'helvetica'
      },
      columnStyles: {
        6: { halign: "right" }
      }
    });

    doc.save(`Booking_List_${dayjs().format("YYYYMMDD_HHmm")}.pdf`);
    message.success("Exported to PDF successfully");
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6 bg-[#fcfdfe] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Title level={3} className="m-0 font-bold tracking-tight text-slate-800">Booking List</Title>
        </div>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Quick search..."
            prefix={<SearchOutlined className="text-slate-400" />}
            className="w-64 rounded-2xl border-none shadow-sm h-11 bg-white"
            allowClear
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div className="flex items-center gap-2">
            <Link href="/booking/create">
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                className="bg-teal-600 hover:bg-teal-700 rounded-2xl px-6 h-11 font-bold border-none shadow-lg shadow-teal-500/20 transition-all hover:translate-y-[-1px]"
              >
                New Booking
              </Button>
            </Link>

            <div className="h-11 flex items-center bg-white rounded-2xl shadow-sm border border-slate-100 p-1 gap-1">
              <Tooltip title="Refresh Data">
                <Button 
                  type="text"
                  icon={<ReloadOutlined className="text-slate-400" />} 
                  onClick={loadData} 
                  className="rounded-xl h-9 w-9 flex items-center justify-center hover:bg-slate-50 hover:text-teal-600" 
                />
              </Tooltip>
              
              <div className="w-[1px] h-4 bg-slate-100 mx-1"></div>

              <Tooltip title="Export to Excel">
                <Button 
                  type="text"
                  icon={<FileExcelOutlined className="text-emerald-500" />} 
                  onClick={handleExportExcel}
                  className="hover:bg-emerald-50 rounded-xl h-9 px-3 font-bold text-[11px] flex items-center gap-2"
                >
                  Excel
                </Button>
              </Tooltip>
              <Tooltip title="Export to PDF">
                <Button 
                  type="text"
                  icon={<FilePdfOutlined className="text-rose-500" />} 
                  onClick={handleExportPDF}
                  className="hover:bg-rose-50 rounded-xl h-9 px-3 font-bold text-[11px] flex items-center gap-2"
                >
                  PDF
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <Card variant="borderless" className="rounded-3xl shadow-sm border border-slate-50 overflow-hidden" styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="bookingId"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          className="imm-table"
          onRow={(record) => ({
            onClick: () => router.push(`/booking/${record.bookingId}`),
            className: "cursor-pointer"
          })}
        />
      </Card>

      <style jsx global>{`
        .imm-table .ant-table-thead > tr > th {
          background: #fafbfc !important;
          color: #475569 !important;
          font-size: 13px !important;
          font-weight: 700 !important;
          letter-spacing: 0.02em !important;
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 18px 20px !important;
        }
        .imm-table .ant-table-tbody > tr > td {
          padding: 14px 20px !important;
          border-bottom: 1px solid #f8fafc !important;
          font-size: 11px !important;
        }
        .imm-table .ant-table-tbody > tr:hover > td {
          background: #f0fdfa !important;
        }
      `}</style>
    </div>
  );
}
