"use client";

import React, { useEffect, useState, use } from "react";
import {
  Card,
  Col,
  Row,
  Button,
  Typography,
  Space,
  Divider,
  Table,
  message,
  Spin,
  Tag,
  Popconfirm,
  Tooltip
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  PrinterOutlined,
  FileTextOutlined,
  DeleteOutlined,
  CalendarOutlined,
  CompassOutlined,
  UserOutlined,
  PercentageOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  ShoppingOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchBooking, deleteBooking } from "@/lib/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface BookingDetail {
  bookingDetailId?: number;
  product_id?: number;
  productName: string;
  product_name?: string;
  qty: number;
  quantity?: number;
  unitPrice: number;
  unit_price?: number;
  discount_amount?: number;
  lineTotal: number;
  total_price?: number;
}

interface Booking {
  bookingId: number;
  bookingNo: string;
  booking_no?: string;
  bookingDate: string;
  booking_date?: string;
  status: string;
  customerName: string;
  customer_name?: string;
  vesselName: string;
  vessel_name?: string;
  mainVesselLoa: number;
  main_vessel_loa?: number;
  beam: number;
  draft: number;
  stayType?: string;
  stay_type?: string;
  arrivalDate?: string;
  arrival_date?: string;
  departureDate?: string;
  departure_date?: string;
  totalItemBeforeDiscount: number;
  total_item_before_discount?: number;
  vatAmount: number;
  vat_amount?: number;
  grandTotal: number;
  grand_total?: number;
  serviceChargeAmount: number;
  service_charge_amount?: number;
  discountAmount: number;
  discount_amount?: number;
  details: BookingDetail[];
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [data, setData] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const result = await fetchBooking(id);
        setData(result);
      } catch (err: any) {
        message.error(err.message || "Could not load booking details");
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBooking(id);
      message.success("Booking deleted successfully");
      router.push("/booking");
    } catch (err: any) {
      message.error(err.message || "Failed to delete booking");
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (val: any) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#f8fafc]"><Spin size="large" description="Loading reservation details..." /></div>;

  if (!data) return <div className="p-10 text-center bg-[#f8fafc] min-h-screen"><Card variant="borderless" className="shadow-soft max-w-md mx-auto rounded-3xl"><Title level={4}>Reservation Missing</Title><Link href="/booking"><Button type="primary" shape="round">Return to List</Button></Link></Card></div>;

  // normalizing data keys
  const bNo = data.booking_no || data.bookingNo;
  const bDate = data.booking_date || data.bookingDate;
  const cName = data.customer_name || data.customerName;
  const vName = data.vessel_name || data.vesselName;
  const loa = data.main_vessel_loa || data.mainVesselLoa;
  const stay = data.stay_type || data.stayType;
  const arrival = data.arrival_date || data.arrivalDate;
  const departure = data.departure_date || data.departureDate;
  const totalItemBefore = data.total_item_before_discount || data.totalItemBeforeDiscount;
  const discAmt = data.discount_amount || data.discountAmount;
  const scAmt = data.service_charge_amount || data.serviceChargeAmount;
  const vtAmt = data.vat_amount || data.vatAmount;
  const gTotal = data.grand_total || data.grandTotal;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-700 bg-[#f8fafc] min-h-screen">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <Space size="middle">
          <Link href="/booking"><Button icon={<ArrowLeftOutlined />} shape="circle" className="border-slate-200" /></Link>
          <div>
            <div className="flex items-center gap-3">
              <Title level={2} className="m-0 text-slate-800 font-bold">{bNo}</Title>
              <Tag color={data.status === 'confirmed' ? 'success' : 'processing'} className="rounded-full px-4 border-none font-bold uppercase text-[10px] tracking-wider mb-1">
                {data.status || 'DRAFT'}
              </Tag>
            </div>
            <Text type="secondary" className="flex items-center gap-1"><CalendarOutlined className="text-[10px]" /> Created on {dayjs(bDate).format("DD/MM/YYYY")}</Text>
          </div>
        </Space>

        <Space size="middle">
          <Tooltip title="Coming soon">
            <Button icon={<PrinterOutlined />} className="rounded-xl border-slate-200">Print</Button>
          </Tooltip>
          <Button
            icon={<FileTextOutlined />}
            className="rounded-xl border-indigo-200 text-indigo-600 bg-indigo-50 font-bold"
            onClick={() => router.push(`/quotation/create?bookingId=${data.bookingId}`)}
          >
            Generate QU
          </Button>
          <Divider orientation="vertical" className="h-8 border-slate-100" />
          <Button type="primary" icon={<EditOutlined />} className="rounded-xl bg-blue-500 shadow-md border-none px-6" onClick={() => message.info("Edit mode in development")}>Edit</Button>
          <Popconfirm title="Delete Reservation" description="This cannot be undone. Confirm?" onConfirm={handleDelete} okText="Delete" okButtonProps={{ danger: true, loading: deleting }}>
            <Button danger icon={<DeleteOutlined />} type="text" className="hover:bg-red-50">Delete</Button>
          </Popconfirm>
        </Space>
      </div>

      <Row gutter={32}>
        <Col span={17}>
          <Space orientation="vertical" size="large" className="w-full">
            <Row gutter={24}>
              <Col span={10}>
                <Card title={<Space><CalendarOutlined className="text-indigo-500" />Reservation Span</Space>} variant="borderless" className="rounded-3xl shadow-soft h-full">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <Text type="secondary" className="text-[10px]  font-black opacity-50">Arrival</Text>
                        <Text strong className="text-lg">{arrival ? dayjs(arrival).format("DD/MM/YYYY") : "Not Set"}</Text>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center"><ArrowLeftOutlined className="rotate-180 text-slate-300" /></div>
                      <div className="flex flex-col text-right">
                        <Text type="secondary" className="text-[10px]  font-black opacity-50">Departure</Text>
                        <Text strong className="text-lg">{departure ? dayjs(departure).format("DD/MM/YYYY") : "Not Set"}</Text>
                      </div>
                    </div>
                    <Divider className="my-0 border-slate-50" />
                    <div>
                      <Text type="secondary" className="text-[10px]  font-black opacity-50 block mb-2">Rate Type</Text>
                      <Tag color={stay === 'monthly' ? 'blue' : 'cyan'} className="rounded-full px-4 py-1 border-none font-bold text-xs">
                        {stay?.toUpperCase() || 'DAILY'}
                      </Tag>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={14}>
                <Card title={<Space><CompassOutlined className="text-indigo-500" />Vessel Information</Space>} variant="borderless" className="rounded-3xl shadow-soft h-full">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                        <UserOutlined className="text-indigo-500 text-xl" />
                      </div>
                      <div>
                        <Text type="secondary" className="text-[10px]  font-black opacity-50 block">Customer</Text>
                        <Text strong className="text-base text-slate-800">{cName}</Text>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center">
                        <CompassOutlined className="text-slate-400 text-xl" />
                      </div>
                      <div>
                        <Text type="secondary" className="text-[10px]  font-black opacity-50 block">Vessel Name</Text>
                        <Text strong className="text-base text-slate-800">{vName || "No vessel name"}</Text>
                      </div>
                    </div>
                    <div className="bg-slate-50/80 p-5 rounded-2xl flex justify-between gap-4 border border-slate-100">
                      <div className="text-center flex-1 border-r border-slate-200">
                        <Text type="secondary" className="block text-[10px]  font-black opacity-40">LOA</Text>
                        <Text strong className="text-lg text-slate-700">{loa || '0.00'}m</Text>
                      </div>
                      <div className="text-center flex-1 border-r border-slate-200">
                        <Text type="secondary" className="block text-[10px] uppercase font-black opacity-40">Beam</Text>
                        <Text strong className="text-lg text-slate-700">{data.beam || '0.00'}m</Text>
                      </div>
                      <div className="text-center flex-1">
                        <Text type="secondary" className="block text-[10px] uppercase font-black opacity-40">Draft</Text>
                        <Text strong className="text-lg text-slate-700">{data.draft || '0.00'}m</Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            <Card
              variant="borderless"
              title={<Space><ShoppingOutlined className="text-indigo-500" /><span className="font-bold">Products/Services</span></Space>}
              className="rounded-3xl shadow-soft overflow-hidden"
              styles={{ body: { padding: 0 } }}
            >
              <Table dataSource={data.details} pagination={false} rowKey={(r) => r.bookingDetailId || r.product_name || Math.random()} className="modern-table"
                columns={[
                  { title: "Item", dataIndex: "productName", render: (t, r) => <Text strong className="text-slate-700">{t || r.product_name}</Text> },
                  { title: "QTY", dataIndex: "qty", width: 90, align: "center", render: (v, r) => <Text className="text-slate-600 font-medium">{v || r.quantity}</Text> },
                  { title: "Unit price", dataIndex: "unitPrice", width: 140, align: "right", render: (v, r) => <Text className="text-slate-600 font-medium">{formatCurrency(v || r.unit_price)}</Text> },
                  { title: "Discount", width: 140, align: "right", render: (_, r) => <Text className="text-orange-600 font-bold">{formatCurrency(r.discount_amount || r.discount_amount)}</Text> },
                  { title: "Total", dataIndex: "lineTotal", width: 160, align: "right", render: (v, r) => <Text strong className="text-indigo-600 text-base">{formatCurrency(v || r.total_price)}</Text> }
                ]}
              />
            </Card>
          </Space>
        </Col>

        <Col span={7}>
          <div className="sticky top-6 space-y-6">
            <Card title={<span className="text-xs  font-black tracking-widest text-slate-400">Financial Summary</span>} variant="borderless" className="rounded-3xl shadow-lg border border-slate-100">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs px-2">
                  <Text type="secondary">Subtotal Items</Text>
                  <Text strong className="text-slate-700">{formatCurrency(totalItemBefore)}</Text>
                </div>
                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex justify-between items-center">
                  <Space><PercentageOutlined className="text-orange-500" /><Text strong className="text-orange-800 text-xs">Total Discount</Text></Space>
                  <Text className="text-orange-600 font-bold">{formatCurrency(discAmt)}</Text>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex justify-between items-center">
                  <Space><SafetyCertificateOutlined className="text-blue-500" /><Text strong className="text-blue-800 text-xs">Service Charge</Text></Space>
                  <Text className="text-blue-600 font-bold">{formatCurrency(scAmt)}</Text>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between items-center">
                  <Space><AuditOutlined className="text-emerald-500" /><Text strong className="text-emerald-800 text-xs">VAT Amount</Text></Space>
                  <Text className="text-emerald-600 font-bold">{formatCurrency(vtAmt)}</Text>
                </div>
                <div className="p-6 bg-indigo-600 rounded-[2rem] text-center shadow-xl shadow-indigo-100">
                  <Text className="text-white/60 text-[10px]   font-black tracking-widest block mb-1">Grand Total</Text>
                  <Title level={2} className="m-0 text-white font-black" style={{ color: 'white' }}>{formatCurrency(gTotal)}</Title>
                </div>
              </div>
            </Card>
            <Link href="/booking">
              <Button block size="large" className="rounded-2xl h-14 border-slate-200 text-slate-400 hover:text-indigo-600 font-medium">Back to Booking List</Button>
            </Link>
          </div>
        </Col>
      </Row>

      <style jsx global>{`
        .shadow-soft { box-shadow: 0 10px 40px -10px rgba(0,0,0,0.04); }
        .modern-table .ant-table-thead > tr > th {
          background: #fafbfc !important;
          color: #94a3b8 !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          letter-spacing: 0.1em !important;
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 16px 24px !important;
        }
        .modern-table .ant-table-tbody > tr > td {
          padding: 16px 24px !important;
          border-bottom: 1px solid #f8fafc !important;
        }
      `}</style>
    </div>
  );
}
