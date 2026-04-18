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
  Tag
} from "antd";
import { 
  ArrowLeftOutlined, 
  EditOutlined,
  PrinterOutlined,
  FileTextOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchBooking } from "@/lib/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface BookingDetail {
  itemId: number;
  productName: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

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
  totalItemBeforeDiscount: number;
  vatAmount: number;
  grandTotal: number;
  details: BookingDetail[];
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [data, setData] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-40">
        <Spin size="large" description="Fetching booking details..." />
      </div>
    );
  }

  if (!data) {
    return (
      <Card variant="borderless" className="text-center py-20 shadow-sm">
        <Title level={4}>Booking Not Found</Title>
        <Typography.Paragraph>The document you are looking for does not exist or has been removed.</Typography.Paragraph>
        <Link href="/booking">
          <Button type="primary">Back to List</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <Space orientation="horizontal" align="center">
          <Link href="/booking">
            <Button icon={<ArrowLeftOutlined />} shape="circle" />
          </Link>
          <div>
            <Title level={3} className="m-0">Booking Detail</Title>
            <Text type="secondary">{data.bookingNo}</Text>
          </div>
        </Space>
        <Space>
          <Button 
            icon={<FileTextOutlined />} 
            className="border-green-600 text-green-600 hover:text-green-700 hover:border-green-700 font-medium"
            onClick={() => router.push(`/quotation/create?bookingId=${data.bookingId}`)}
          >
            Create QU
          </Button>
          <Button icon={<PrinterOutlined />}>Print</Button>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            className="bg-[#1677ff]"
            onClick={() => message.info("Edit mode coming soon!")}
          >
            Edit Booking
          </Button>
        </Space>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Space orientation="vertical" size="large" className="w-full">
            {/* Summary Section */}
            <Card variant="borderless" className="shadow-sm">
              <Row gutter={16}>
                <Col span={8}>
                  <Text type="secondary" className="block mb-1 text-xs uppercase font-bold tracking-wider">Status</Text>
                  <Tag color="blue" className="px-3 py-1 text-sm font-medium uppercase">{data.status}</Tag>
                </Col>
                <Col span={8}>
                  <Text type="secondary" className="block mb-1 text-xs uppercase font-bold tracking-wider">Booking Date</Text>
                  <Text strong className="text-lg">{dayjs(data.bookingDate).format("DD/MM/YYYY")}</Text>
                </Col>
                <Col span={8}>
                  <Text type="secondary" className="block mb-1 text-xs uppercase font-bold tracking-wider">Customer</Text>
                  <Text strong className="text-lg">{data.customerName}</Text>
                </Col>
              </Row>
            </Card>

            {/* Vessel Info */}
            <Card title="Vessel Details" variant="borderless" className="shadow-sm">
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary" className="block mb-1">Vessel Name</Text>
                  <Text strong>{data.vesselName || "N/A"}</Text>
                </Col>
                <Col span={4}>
                  <Text type="secondary" className="block mb-1">LOA</Text>
                  <Text strong>{data.mainVesselLoa || 0} m</Text>
                </Col>
                <Col span={4}>
                  <Text type="secondary" className="block mb-1">Beam</Text>
                  <Text strong>{data.beam || 0} m</Text>
                </Col>
                <Col span={4}>
                  <Text type="secondary" className="block mb-1">Draft</Text>
                  <Text strong>{data.draft || 0} m</Text>
                </Col>
              </Row>
            </Card>

            {/* Items Table */}
            <Card title="Booking Items" variant="borderless" className="shadow-sm">
              <Table
                dataSource={data.details}
                pagination={false}
                rowKey="itemId"
                columns={[
                  {
                    title: "Description",
                    dataIndex: "productName",
                    key: "productName",
                    render: (text) => <Text strong>{text}</Text>
                  },
                  {
                    title: "Qty",
                    dataIndex: "qty",
                    key: "qty",
                    align: "right",
                  },
                  {
                    title: "Unit Price",
                    dataIndex: "unitPrice",
                    key: "unitPrice",
                    align: "right",
                    render: (val) => new Intl.NumberFormat("th-TH").format(val)
                  },
                  {
                    title: "Total",
                    dataIndex: "lineTotal",
                    key: "lineTotal",
                    align: "right",
                    render: (val) => <Text strong>{new Intl.NumberFormat("th-TH").format(val)}</Text>
                  },
                ]}
              />
            </Card>
          </Space>
        </Col>

        <Col span={8}>
          <div className="sticky top-24">
            <Card title="Payment Summary" variant="borderless" className="shadow-sm">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Text type="secondary">Subtotal</Text>
                  <Text strong>{new Intl.NumberFormat("th-TH").format(data.totalItemBeforeDiscount || 0)} THB</Text>
                </div>
                <div className="flex justify-between items-center">
                  <Text type="secondary">VAT (7%)</Text>
                  <Text strong>{new Intl.NumberFormat("th-TH").format(data.vatAmount || 0)} THB</Text>
                </div>
                <Divider className="my-2" />
                <div className="flex justify-between items-center">
                  <Title level={4} className="m-0">Grand Total</Title>
                  <Title level={4} className="m-0 text-[#1677ff]">
                    {new Intl.NumberFormat("th-TH").format(data.grandTotal || 0)} THB
                  </Title>
                </div>
              </div>
            </Card>
            
            <div className="mt-6">
               <Link href="/booking">
                 <Button block size="large">Back to List</Button>
               </Link>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}
