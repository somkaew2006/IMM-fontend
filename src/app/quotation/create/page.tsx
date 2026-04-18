"use client";

import React, { useEffect, useState, use, Suspense } from "react";
import { 
  Card, 
  Col, 
  Row, 
  Typography, 
  Space, 
  Button, 
  Spin, 
  message, 
  Result,
  Divider,
  Tag
} from "antd";
import { 
  ArrowLeftOutlined, 
  SaveOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchBooking } from "@/lib/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;

function CreateQuotationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(!!bookingId);

  useEffect(() => {
    if (bookingId) {
      const loadRefData = async () => {
        try {
          const data = await fetchBooking(bookingId);
          setBookingData(data);
        } catch (err: any) {
          message.error("Failed to load reference booking data");
        } finally {
          setLoading(false);
        }
      };
      loadRefData();
    }
  }, [bookingId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-40">
        <Space orientation="vertical" align="center">
          <Spin size="large" />
          <Text type="secondary">Preparing Quotation from Booking #{bookingId}...</Text>
        </Space>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <Space orientation="horizontal" align="center">
          <Button icon={<ArrowLeftOutlined />} shape="circle" onClick={() => router.back()} />
          <div>
            <Title level={3} className="m-0">Create New Quotation (QU)</Title>
            {bookingId && <Tag color="blue">Linked to Booking #{bookingData?.bookingNo || bookingId}</Tag>}
          </div>
        </Space>
        <Space>
          <Button onClick={() => router.back()}>Cancel</Button>
          <Button type="primary" icon={<SaveOutlined />} className="bg-[#1677ff]" onClick={() => message.success("QU Saved (Simulation)")}>
            Save Quotation
          </Button>
        </Space>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Space orientation="vertical" size="large" className="w-full">
            <Card title="Quotation Details" variant="borderless" className="shadow-sm">
               <Result
                  icon={<CheckCircleOutlined className="text-blue-500" />}
                  title="Ready to Create Quotation"
                  subTitle={bookingData ? `Data inherited from Booking ${bookingData.bookingNo}` : "Start a new quotation from scratch."}
                  extra={[
                    <Button type="primary" key="setup" onClick={() => message.info("Form implementation coming soon!")}>
                      Configure Quotation Terms
                    </Button>,
                  ]}
                />
            </Card>

            {bookingData && (
              <Card title="Referencing Data" variant="borderless" className="shadow-sm">
                 <div className="space-y-4">
                    <Row>
                       <Col span={12}>
                          <Text type="secondary">Customer</Text><br/>
                          <Text strong>{bookingData.customerName}</Text>
                       </Col>
                       <Col span={12}>
                          <Text type="secondary">Vessel</Text><br/>
                          <Text strong>{bookingData.vesselName || "N/A"}</Text>
                       </Col>
                    </Row>
                    <Divider />
                    <div className="bg-gray-50 p-4 rounded text-center">
                       <Text type="secondary" italic>The items and prices from this booking will be automatically imported into the quotation line items.</Text>
                    </div>
                 </div>
              </Card>
            )}
          </Space>
        </Col>

        <Col span={8}>
          <Card title="Summary" variant="borderless" className="shadow-sm">
             <div className="text-center py-10">
                <Text type="secondary">Financial details will appear here once the form is populated.</Text>
             </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
export default function CreateQuotation() {
  return (
    <Suspense fallback={<div className="flex justify-center py-40"><Spin size="large" description="Loading Quotation Module..." /></div>}>
      <CreateQuotationContent />
    </Suspense>
  );
}
