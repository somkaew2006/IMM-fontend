"use client";

import React, { useEffect, useMemo } from "react";
import { 
  Card, 
  Col, 
  Row, 
  Input, 
  Button, 
  DatePicker, 
  Form as AntForm, 
  Typography, 
  Space, 
  Divider, 
  InputNumber, 
  Table, 
  message 
} from "antd";
import { 
  PlusOutlined, 
  DeleteOutlined, 
  SaveOutlined, 
  ArrowLeftOutlined 
} from "@ant-design/icons";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBooking } from "@/lib/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;

// --- Validation Schema ---
const itemSchema = z.object({
  productName: z.string().min(1, "Required"),
  qty: z.number().min(1, "Min 1"),
  unitPrice: z.number().min(0),
  lineTotal: z.number(),
});

const bookingFormSchema = z.object({
  bookingNo: z.string().min(1, "Booking No is required"),
  bookingDate: z.any(),
  customerName: z.string().min(1, "Customer is required"),
  customerId: z.number(),
  vesselName: z.string().optional(),
  mainVesselLoa: z.number(),
  beam: z.number(),
  draft: z.number(),
  status: z.string(),
  details: z.array(itemSchema).min(1, "At least one item is required"),
  vatPercent: z.number(),
  totalItemBeforeDiscount: z.number(),
  vatAmount: z.number(),
  grandTotal: z.number(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

export default function CreateBooking() {
  const router = useRouter();
  
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      bookingNo: `BK-${dayjs().format("YYYYMMDD-HHmm")}`,
      bookingDate: dayjs(),
      customerName: "",
      customerId: 1,
      vesselName: "",
      mainVesselLoa: 0,
      beam: 0,
      draft: 0,
      status: "draft",
      details: [{ productName: "", qty: 1, unitPrice: 0, lineTotal: 0 }],
      vatPercent: 7,
      totalItemBeforeDiscount: 0,
      vatAmount: 0,
      grandTotal: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "details" as never,
  });

  // --- Real-time Calculations ---
  const watchedDetails = useWatch({ control, name: "details" });
  const vatPercent = useWatch({ control, name: "vatPercent" }) || 7;

  useEffect(() => {
    let totalBeforeVat = 0;
    
    // Update individual line totals and sum them up
    if (watchedDetails) {
      watchedDetails.forEach((item: any, index: number) => {
        const lineTotal = (item.qty || 0) * (item.unitPrice || 0);
        if (item.lineTotal !== lineTotal) {
          setValue(`details.${index}.lineTotal` as any, lineTotal);
        }
        totalBeforeVat += lineTotal;
      });
    }

    const vatAmount = (totalBeforeVat * vatPercent) / 100;
    const grandTotal = totalBeforeVat + vatAmount;

    setValue("totalItemBeforeDiscount", totalBeforeVat);
    setValue("vatAmount", vatAmount);
    setValue("grandTotal", grandTotal);
  }, [watchedDetails, vatPercent, setValue]);

  const onSubmit = async (data: BookingFormValues) => {
    try {
      // Map dates to ISO strings for backend
      const payload = {
        ...data,
        bookingDate: data.bookingDate ? data.bookingDate.toISOString() : undefined,
      };
      await createBooking(payload);
      message.success("Booking created successfully!");
      router.push("/booking");
    } catch (err: any) {
      message.error(err.message || "Something went wrong");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <Space orientation="horizontal" align="center">
          <Link href="/booking">
            <Button icon={<ArrowLeftOutlined />} shape="circle" />
          </Link>
          <Title level={3} className="m-0">Create New Booking</Title>
        </Space>
        <Space>
          <Button onClick={() => router.push("/booking")}>Cancel</Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting}
            className="bg-[#1677ff]"
          >
            Save Booking
          </Button>
        </Space>
      </div>

      <AntForm layout="vertical">
        <Row gutter={24}>
          {/* Main Info */}
          <Col span={16}>
            <Space orientation="vertical" size="large" className="w-full">
              {/* Basic Section */}
              <Card title="General Information" variant="borderless" className="shadow-sm">
                <Row gutter={16}>
                  <Col span={12}>
                    <AntForm.Item label="Booking No" required validateStatus={errors.bookingNo ? "error" : ""}>
                      <Controller
                        name="bookingNo"
                        control={control}
                        render={({ field }) => <Input {...field} disabled />}
                      />
                    </AntForm.Item>
                  </Col>
                  <Col span={12}>
                    <AntForm.Item label="Booking Date" required>
                      <Controller
                        name="bookingDate"
                        control={control}
                        render={({ field }) => <DatePicker {...field} className="w-full" format="DD/MM/YYYY" />}
                      />
                    </AntForm.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={24}>
                    <AntForm.Item label="Customer Name" required validateStatus={errors.customerName ? "error" : ""} help={errors.customerName?.message}>
                      <Controller
                        name="customerName"
                        control={control}
                        render={({ field }) => <Input {...field} placeholder="Enter customer name" />}
                      />
                    </AntForm.Item>
                  </Col>
                </Row>
              </Card>

              {/* Vessel Section */}
              <Card title="Vessel Information" variant="borderless" className="shadow-sm">
                <Row gutter={16}>
                  <Col span={24}>
                    <AntForm.Item label="Vessel Name">
                      <Controller
                        name="vesselName"
                        control={control}
                        render={({ field }) => <Input {...field} placeholder="e.g. M.V. Ocean Star" />}
                      />
                    </AntForm.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={8}>
                    <AntForm.Item label="LOA (m)">
                      <Controller
                        name="mainVesselLoa"
                        control={control}
                        render={({ field }) => <InputNumber {...field} className="w-full" min={0} />}
                      />
                    </AntForm.Item>
                  </Col>
                  <Col span={8}>
                    <AntForm.Item label="Beam (m)">
                      <Controller
                        name="beam"
                        control={control}
                        render={({ field }) => <InputNumber {...field} className="w-full" min={0} />}
                      />
                    </AntForm.Item>
                  </Col>
                  <Col span={8}>
                    <AntForm.Item label="Draft (m)">
                      <Controller
                        name="draft"
                        control={control}
                        render={({ field }) => <InputNumber {...field} className="w-full" min={0} />}
                      />
                    </AntForm.Item>
                  </Col>
                </Row>
              </Card>

              {/* Items Section */}
              <Card 
                title={
                  <div className="flex justify-between items-center">
                    <span>Booking Items</span>
                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => append({ productName: "", qty: 1, unitPrice: 0, lineTotal: 0 })}>
                      Add Item
                    </Button>
                  </div>
                } 
                variant="borderless" 
                className="shadow-sm"
              >
                <Table
                  dataSource={fields}
                  pagination={false}
                  rowKey="id"
                  className="mb-4"
                  columns={[
                    {
                      title: "Product/Service",
                      dataIndex: "productName",
                      key: "productName",
                      render: (_, record, index) => (
                        <Controller
                          name={`details.${index}.productName` as any}
                          control={control}
                          render={({ field }) => <Input {...field} placeholder="Description" />}
                        />
                      ),
                    },
                    {
                      title: "Qty",
                      dataIndex: "qty",
                      key: "qty",
                      width: 120,
                      render: (_, record, index) => (
                        <Controller
                          name={`details.${index}.qty` as any}
                          control={control}
                          render={({ field }) => <InputNumber {...field} className="w-full" min={1} />}
                        />
                      ),
                    },
                    {
                      title: "Unit Price",
                      dataIndex: "unitPrice",
                      key: "unitPrice",
                      width: 150,
                      render: (_, record, index) => (
                        <Controller
                          name={`details.${index}.unitPrice` as any}
                          control={control}
                          render={({ field }) => <InputNumber {...field} className="w-full" min={0} />}
                        />
                      ),
                    },
                    {
                      title: "Total",
                      dataIndex: "lineTotal",
                      key: "lineTotal",
                      width: 150,
                      align: "right",
                      render: (_, record, index) => (
                        <Text strong>
                          {new Intl.NumberFormat("th-TH").format(watchedDetails?.[index]?.lineTotal || 0)}
                        </Text>
                      ),
                    },
                    {
                      title: "",
                      key: "action",
                      width: 50,
                      render: (_, record, index) => (
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={() => remove(index)} 
                          disabled={fields.length === 1}
                        />
                      ),
                    },
                  ]}
                />
                {errors.details && <Text type="danger">{errors.details.message}</Text>}
              </Card>
            </Space>
          </Col>

          {/* Sidebar Area (Totals) */}
          <Col span={8}>
            <div className="sticky top-24">
              <Card title="Billing Summary" variant="borderless" className="shadow-sm">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Text type="secondary">Subtotal</Text>
                    <Text strong>{new Intl.NumberFormat("th-TH").format(useWatch({ control, name: "totalItemBeforeDiscount" }) || 0)} THB</Text>
                  </div>
                  <div className="flex justify-between items-center">
                    <Text type="secondary">VAT ({vatPercent}%)</Text>
                    <Text strong>{new Intl.NumberFormat("th-TH").format(useWatch({ control, name: "vatAmount" }) || 0)} THB</Text>
                  </div>
                  <Divider className="my-2" />
                  <div className="flex justify-between items-center">
                    <Title level={4} className="m-0">Grand Total</Title>
                    <Title level={4} className="m-0 text-[#1677ff]">
                      {new Intl.NumberFormat("th-TH").format(useWatch({ control, name: "grandTotal" }) || 0)} THB
                    </Title>
                  </div>
                </div>
              </Card>

              <div className="mt-6 flex flex-col gap-2">
                <Button 
                  type="primary" 
                  size="large" 
                  className="w-full bg-[#1677ff]" 
                  icon={<SaveOutlined />}
                  onClick={handleSubmit(onSubmit)}
                  loading={isSubmitting}
                >
                  Confirm & Save
                </Button>
                <Button block size="large" onClick={() => router.push("/booking")}>
                  Return to List
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </AntForm>
    </div>
  );
}
