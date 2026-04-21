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
import { fetchQuotations } from "@/lib/api";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FileExcelOutlined, FilePdfOutlined, DownloadOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface Quotation {
  quId: number;
  quNo: string;
  quDate: string;
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
  refBookingNo?: string;
  ref_booking_no?: string;
}

export default function QuotationListPage() {
  const router = useRouter();
  const [data, setData] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchQuotations();
      setData(result);
    } catch (error) {
      console.error(error);
      message.error("Failed to sync quotation records");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredData = data.filter(item => {
    const qNo = item.quNo || "";
    const cName = item.customerName || "";
    const vName = item.vesselName || "";
    const refNo = item.refBookingNo || item.ref_booking_no || "";
    return qNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refNo.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const columns = [
    {
      title: "Quotation No",
      dataIndex: "quNo",
      key: "quNo",
      width: 150,
      render: (text: string, record: Quotation) => (
        <div className="flex flex-col py-0.5 whitespace-nowrap">
          <Text strong className="text-indigo-600 font-mono hover:text-blue-500 cursor-pointer">
            {text}
          </Text>
          <Text className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 tracking-wide">
            <CalendarOutlined style={{ fontSize: '9px' }} />
            {dayjs(record.quDate).format("DD/MM/YYYY")}
          </Text>
        </div>
      )
    },
    {
      title: "Ref Booking",
      key: "refBooking",
      width: 130,
      render: (_: any, record: Quotation) => {
        const refNo = record.refBookingNo || record.ref_booking_no;
        return refNo ? (
          <Tag color="geekblue" className="rounded-full px-3 py-0 text-[10px] font-bold border-none whitespace-nowrap">
            {refNo}
          </Tag>
        ) : (
          <Text type="secondary" className="text-[10px] opacity-40 italic">-</Text>
        );
      }
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
          <Text className="text-slate-700 font-medium">{text || "N/A"}</Text>
        </Space>
      )
    },
    {
      title: "Vessel",
      key: "vessel",
      render: (_: any, record: Quotation) => (
        <div className="flex flex-col">
          <Space size={6}>
            <CompassOutlined className="text-indigo-300" />
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
      width: 120,
      render: (_: any, record: Quotation) => (
        <div className="flex flex-col gap-0.5 whitespace-nowrap">
          <Text className="text-xs text-slate-600 font-medium tracking-tight">
            {record.arrivalDate ? dayjs(record.arrivalDate).format("DD/MM/YYYY") : "-"}
          </Text>
          <Text className="text-xs text-slate-400 font-medium tracking-tight">
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
        <Tag color={val === 'monthly' ? 'blue' : 'cyan'} className="m-0 border-none px-2.5 rounded-full text-[10px] font-bold  tracking-wider">
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
        const status = val?.toLowerCase() || "draft";
        let color = "default";
        if (status === "active" || status === "confirmed" || status === "approved" || status === "complete") color = "success";
        if (status === "draft") color = "processing";
        if (status === "pending") color = "warning";
        return (
          <Tag color={color} className="rounded-full px-3 py-0 text-[10px] font-bold border-none tracking-wide ">
            {status}
          </Tag>
        );
      }
    }
  ];

  const handleExportExcel = () => {
    const exportData = filteredData.map(item => ({
      "Quotation No": item.quNo,
      "Date": dayjs(item.quDate).format("DD/MM/YYYY"),
      "Ref Booking": item.refBookingNo || item.ref_booking_no || "-",
      "Customer": item.customerName || "N/A",
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
    XLSX.utils.book_append_sheet(wb, ws, "Quotations");
    XLSX.writeFile(wb, `Quotation_List_${dayjs().format("YYYYMMDD_HHmm")}.xlsx`);
    message.success("Exported to Excel successfully");
  };

  const handleExportPDF = () => {
    const tableData = filteredData.map(item => [
      item.quNo,
      dayjs(item.quDate).format("DD/MM/YYYY"),
      item.customerName || "N/A",
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
    doc.text("Quotation List", 14, 15);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Generated on: ${dayjs().format("DD/MM/YYYY HH:mm")}`, 14, 22);
    doc.text(`Total Records: ${tableData.length}`, 14, 27);

    autoTable(doc, {
      startY: 32,
      head: [["QU No", "Date", "Customer", "Vessel", "Arrival", "Type", "Total", "Status"]],
      body: tableData,
      theme: "striped",
      headStyles: { 
        fillColor: [79, 70, 229], // Indigo-600
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

    doc.save(`Quotation_List_${dayjs().format("YYYYMMDD_HHmm")}.pdf`);
    message.success("Exported to PDF successfully");
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6 bg-[#f1f5f9] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Title level={3} className="m-0 font-bold tracking-tight text-slate-800">Quotation List</Title>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search documents..."
            prefix={<SearchOutlined className="text-slate-300" />}
            className="w-64 rounded-xl border-none shadow-sm h-11"
            allowClear
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Link href="/quotation/create">
            <Button type="primary" icon={<PlusOutlined />} className="bg-indigo-600 rounded-xl px-6 h-11 font-bold shadow-md shadow-indigo-100 border-none transition-all hover:scale-105">
              New Quotation
            </Button>
          </Link>
          <Button icon={<ReloadOutlined />} onClick={loadData} className="rounded-xl h-11 w-11 border-none shadow-sm flex items-center justify-center hover:text-indigo-600" />
          
          <div className="flex items-center gap-2 p-1.5 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100">
            <Tooltip title="Export to Excel">
              <Button 
                icon={<FileExcelOutlined />} 
                onClick={handleExportExcel}
                className="bg-emerald-500 text-white rounded-xl border-none h-9 px-3 hover:bg-emerald-600 transition-all font-bold flex items-center gap-2 text-xs"
              >
                Excel
              </Button>
            </Tooltip>
            <Tooltip title="Export to PDF">
              <Button 
                icon={<FilePdfOutlined />} 
                onClick={handleExportPDF}
                className="bg-rose-500 text-white rounded-xl border-none h-9 px-3 hover:bg-rose-600 transition-all font-bold flex items-center gap-2 text-xs"
              >
                PDF
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <Card variant="borderless" className="rounded-[2rem] shadow-xl border-none overflow-hidden" styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="quId"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          className="imm-table"
          onRow={(record) => ({
            onClick: () => router.push(`/quotation/${record.quId}`),
            className: "cursor-pointer group"
          })}
        />
      </Card>

      <style jsx global>{`
        .imm-table .ant-table-thead > tr > th {
          background: #ffffff !important;
          color: #64748b !important;
          font-size: 11px !important;
          font-weight: 800 !important;
          letter-spacing: 0.1em !important;
          border-bottom: 2px solid #f8fafc !important;
          padding: 20px 16px !important;
        }
        .imm-table .ant-table-tbody > tr > td {
          padding: 12px 16px !important;
          border-bottom: 1px solid #f1f5f9 !important;
          font-size: 10px !important;
          transition: all 0.2s;
          white-space: nowrap;
        }
        /* Zebra Striping */
        .imm-table .ant-table-tbody > tr:nth-child(even) {
          background-color: #fafbfc;
        }
        .imm-table .ant-table-tbody > tr:hover > td {
          background: #eff6ff !important;
        }
      `}</style>
    </div>
  );
}
