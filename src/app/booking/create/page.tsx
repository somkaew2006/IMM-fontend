"use client";

import React, { useEffect, useMemo, useCallback } from "react";
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
  Spin,
  Select,
  Radio,
  message,
  Tag,
  Tooltip
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  UserOutlined,
  CompassOutlined,
  ShoppingOutlined,
  SafetyCertificateOutlined,
  PercentageOutlined,
  AuditOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBooking, fetchVesselRelations, fetchProducts, fetchBerthPrices } from "@/lib/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;

// --- Helper Functions ---
const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

const formatCurrency = (num: number) =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

// --- Validation Schema ---
const itemSchema = z.object({
  productId: z.number().optional(), // Added for DB
  productName: z.string().min(1, "Required"),
  qty: z.number().min(0.01, "Min 0.01"),
  unitPrice: z.number().min(0),
  discountType: z.enum(["amount", "percent"]).default("percent"),
  discountValue: z.number().default(0),
  discountAmount: z.number().default(0),
  lineTotal: z.number(),
});

const bookingFormSchema = z.object({
  bookingNo: z.string().min(1, "Booking No is required"),
  bookingDate: z.any(),
  arrivalDate: z.any().optional(),
  departureDate: z.any().optional(),
  stayType: z.enum(["daily", "monthly"]).default("daily"),
  customerName: z.string().min(1, "Customer is required"),
  customerId: z.number(),
  vesselId: z.number().optional(), // Added for DB
  vesselName: z.string().optional(),
  mainVesselLoa: z.number(),
  beam: z.number(),
  draft: z.number(),
  status: z.string(),
  details: z.array(itemSchema).min(1, "At least one item is required"),
  totalItems: z.number(),
  discountType: z.enum(["amount", "percent"]).default("percent"),
  discountValue: z.number().default(0),
  discountAmount: z.number().default(0),
  serviceChargePercent: z.number().default(10),
  serviceChargeAmount: z.number().default(0),
  vatPercent: z.number().default(7),
  vatAmount: z.number(),
  grandTotal: z.number(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface VesselRelation {
  vesselRelationId: number;
  customer: {
    customerId: number;
    customerName: string;
  };
  vessel: {
    vesselId: number;
    vesselName: string;
    loa: number;
    beam: number;
    draft: number;
  };
}

interface Product {
  productId: number;
  productCode: string;
  productName: string;
  productType: string;
  standardPrice: number;
}

interface BerthPrice {
  productId: number;
  startLength: number;
  endLength: number;
  dailyPrice: number;
  monthlyPrice: number;
}

export default function CreateBooking() {
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);
  const [relations, setRelations] = React.useState<VesselRelation[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [berthPrices, setBerthPrices] = React.useState<BerthPrice[]>([]);

  useEffect(() => {
    setIsMounted(true);
    const loadData = async () => {
      try {
        const [relationData, productData, berthPriceData] = await Promise.all([
          fetchVesselRelations(),
          fetchProducts(),
          fetchBerthPrices()
        ]);
        setRelations(relationData);
        setProducts(productData);
        setBerthPrices(berthPriceData);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    };
    loadData();
  }, []);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema) as any,
    defaultValues: {
      bookingNo: "",
      bookingDate: dayjs(),
      customerName: "",
      customerId: 1,
      vesselId: 0,
      vesselName: "",
      mainVesselLoa: 0,
      beam: 0,
      draft: 0,
      status: "draft",
      details: [{ productName: "", qty: 1, unitPrice: 0, discountType: "percent", discountValue: 0, discountAmount: 0, lineTotal: 0 }],
      totalItems: 0,
      stayType: "daily",
      discountType: "percent",
      discountValue: 0,
      discountAmount: 0,
      serviceChargePercent: 10,
      serviceChargeAmount: 0,
      vatPercent: 7,
      vatAmount: 0,
      grandTotal: 0,
    },
  });

  useEffect(() => {
    if (isMounted) {
      setValue("bookingNo", `BK-${dayjs().format("YYYYMMDD-HHmm")}`);
      setValue("bookingDate", dayjs());
    }
  }, [isMounted, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "details" as never,
  });

  // --- Watchers ---
  const watchedCustomerName = useWatch({ control, name: "customerName" });
  const watchedVesselName = useWatch({ control, name: "vesselName" });
  const watchedDetails = useWatch({ control, name: "details" });
  const watchedLoa = useWatch({ control, name: "mainVesselLoa" });
  const watchedBeam = useWatch({ control, name: "beam" });
  const watchedDraft = useWatch({ control, name: "draft" });
  const watchedStayType = useWatch({ control, name: "stayType" });
  const watchedArrivalDate = useWatch({ control, name: "arrivalDate" });
  const watchedDepartureDate = useWatch({ control, name: "departureDate" });
  const vatPercentValue = useWatch({ control, name: "vatPercent" }) || 7;
  const totalItemsValue = useWatch({ control, name: "totalItems" }) || 0;
  const globalDiscountType = useWatch({ control, name: "discountType" }) || "percent";
  const globalDiscountValue = useWatch({ control, name: "discountValue" }) || 0;
  const globalDiscountAmountValue = useWatch({ control, name: "discountAmount" }) || 0;
  const serviceChargePercentValue = useWatch({ control, name: "serviceChargePercent" }) || 10;
  const serviceChargeAmountValue = useWatch({ control, name: "serviceChargeAmount" }) || 0;
  const vatAmountValue = useWatch({ control, name: "vatAmount" }) || 0;
  const grandTotalValue = useWatch({ control, name: "grandTotal" }) || 0;

  // --- Lists ---
  const uniqueCustomers = useMemo(() => {
    const names = Array.from(new Set(relations.map(r => r.customer.customerName)));
    return names.map(name => ({ label: name, value: name }));
  }, [relations]);

  const filteredVessels = useMemo(() => {
    let filtered = relations;
    if (watchedCustomerName) filtered = relations.filter(r => r.customer.customerName === watchedCustomerName);
    const names = Array.from(new Set(filtered.map(r => r.vessel.vesselName)));
    return names.map(name => ({ label: name, value: name }));
  }, [relations, watchedCustomerName]);

  // --- Logic ---
  const getBerthingPrice = useCallback((productName: string, loa: number, stayType: string) => {
    const product = products.find(p => p.productName === productName);
    if (!product) return 0;
    const priceConfig = berthPrices.find(bp => bp.productId === product.productId && loa >= bp.startLength && loa <= bp.endLength);
    if (priceConfig) return stayType === "daily" ? Number(priceConfig.dailyPrice) : Number(priceConfig.monthlyPrice);
    return Number(product.standardPrice);
  }, [products, berthPrices]);

  const calculatedQty = useMemo(() => {
    if (!watchedArrivalDate || !watchedDepartureDate) return 1;
    const start = dayjs(watchedArrivalDate); const end = dayjs(watchedDepartureDate);
    if (watchedStayType === "daily") { const diff = end.diff(start, "day"); return diff >= 0 ? diff + 1 : 1; }
    else { const diff = end.diff(start, "month"); return diff > 0 ? diff : 1; }
  }, [watchedArrivalDate, watchedDepartureDate, watchedStayType]);

  useEffect(() => {
    if (watchedDetails) {
      watchedDetails.forEach((item: any, index: number) => {
        const product = products.find(p => p.productName === item.productName);
        if (product && product.productType === "berthing") {
          const newPrice = round2(getBerthingPrice(item.productName, watchedLoa, watchedStayType));
          if (item.unitPrice !== newPrice) setValue(`details.${index}.unitPrice` as any, newPrice);
          if (item.qty !== calculatedQty) setValue(`details.${index}.qty` as any, calculatedQty);
        }
      });
    }
  }, [watchedLoa, watchedStayType, calculatedQty, products, getBerthingPrice, setValue]);

  useEffect(() => {
    let totalItemsSum = 0;
    if (watchedDetails) {
      watchedDetails.forEach((item: any, index: number) => {
        const subtotal = round2((watchedLoa || 0) * (item.qty || 0) * (item.unitPrice || 0));
        let itemDiscountAmt = 0;
        if (item.discountType === "amount") itemDiscountAmt = round2(item.discountValue || 0);
        else itemDiscountAmt = round2((subtotal * (item.discountValue || 0)) / 100);
        const lineTotal = round2(subtotal - itemDiscountAmt);
        if (item.discountAmount !== itemDiscountAmt) setValue(`details.${index}.discountAmount` as any, itemDiscountAmt);
        if (item.lineTotal !== lineTotal) setValue(`details.${index}.lineTotal` as any, lineTotal);
        totalItemsSum = round2(totalItemsSum + lineTotal);
      });
    }
    setValue("totalItems", totalItemsSum);
    const globalDiscAmt = globalDiscountType === "amount" ? round2(globalDiscountValue || 0) : round2((totalItemsSum * (globalDiscountValue || 0)) / 100);
    setValue("discountAmount", globalDiscAmt);
    const afterDiscount = round2(totalItemsSum - globalDiscAmt);
    const scAmt = round2((afterDiscount * (serviceChargePercentValue || 0)) / 100);
    setValue("serviceChargeAmount", scAmt);
    const taxableAmount = round2(afterDiscount + scAmt);
    const vtAmt = round2((taxableAmount * (vatPercentValue || 0)) / 100);
    setValue("vatAmount", vtAmt);
    setValue("grandTotal", round2(taxableAmount + vtAmt));
  }, [watchedDetails, vatPercentValue, globalDiscountType, globalDiscountValue, serviceChargePercentValue, watchedLoa, setValue]);

  // --- Handlers ---
  const handleCustomerChange = (val: string) => {
    setValue("customerName", val);
    const rel = relations.find(r => r.customer.customerName === val);
    if (rel) setValue("customerId", rel.customer.customerId);
  };

  const handleVesselChange = (val: string) => {
    setValue("vesselName", val);
    const rel = relations.find(r => r.vessel.vesselName === val);
    if (rel) {
      setValue("customerName", rel.customer.customerName);
      setValue("customerId", rel.customer.customerId);
      setValue("vesselId", rel.vessel.vesselId);
      setValue("mainVesselLoa", Number(rel.vessel.loa));
      setValue("beam", Number(rel.vessel.beam));
      setValue("draft", Number(rel.vessel.draft));
    }
  };

  const handleProductSelect = (val: string, i: number) => {
    const p = products.find(prod => prod.productName === val);
    if (p) {
      const pr = round2(getBerthingPrice(val, watchedLoa, watchedStayType));
      setValue(`details.${i}.productId` as any, p.productId);
      setValue(`details.${i}.productName` as any, p.productName);
      setValue(`details.${i}.unitPrice` as any, pr);
      setValue(`details.${i}.qty` as any, calculatedQty);
    }
  };

  const onFormSubmit = async (data: BookingFormValues) => {
    try {
      // Mapping to Backend Database structure (Snake Case)
      const payload = {
        booking_no: data.bookingNo,
        booking_date: data.bookingDate?.toISOString(),
        arrival_date: data.arrivalDate?.toISOString(),
        departure_date: data.departureDate?.toISOString(),
        stay_type: data.stayType,
        customer_id: data.customerId,
        customer_name: data.customerName,
        vessel_id: data.vesselId,
        vessel_name: data.vesselName,
        main_vessel_loa: data.mainVesselLoa,
        beam: data.beam,
        draft: data.draft,
        status: data.status,
        total_item_before_discount: data.totalItems,
        discount_amount: data.discountAmount,
        service_charge_amount: data.serviceChargeAmount,
        vat_amount: data.vatAmount,
        grand_total: data.grandTotal,
        details: data.details.map(item => ({
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.qty,
          unit_price: item.unitPrice,
          discount_amount: item.discountAmount,
          total_price: item.lineTotal
        }))
      };

      await createBooking(payload);
      message.success("Booking saved Successfully");
      router.push("/booking");
    } catch (e: any) {
      message.error(e.message || "Failed to save to database");
    }
  };

  if (!isMounted) return <div className="h-screen flex items-center justify-center"><Spin size="large" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-700 bg-[#f8fafc] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <Space size="middle">
          <Link href="/booking"><Button icon={<ArrowLeftOutlined />} shape="circle" /></Link>
          <div><Title level={2} className="m-0 text-slate-800 font-bold">New Booking</Title><Text type="secondary">Save reservation to database</Text></div>
        </Space>
        <Space size="small"><Button onClick={() => router.push("/booking")} className="rounded-xl border-slate-200">Cancel</Button></Space>
      </div>

      <Row gutter={32}>
        <Col span={17}>
          <Space orientation="vertical" size="large" orientation="vertical" className="w-full">
            <Row gutter={24}>
              <Col span={11}>
                <Card title="Reservation Info" variant="borderless" className="rounded-3xl shadow-soft">
                  <AntForm layout="vertical" className="space-y-4">
                    <Row gutter={12}>
                      <Col span={10}><AntForm.Item label="ID" className="mb-0"><Controller name="bookingNo" control={control} render={({ field }) => <Tag color="blue" className="px-4 py-1 text-base font-mono rounded-lg w-full">{field.value || '...'}</Tag>} /></AntForm.Item></Col>
                      <Col span={14}><AntForm.Item label="Date" className="mb-0"><Controller name="bookingDate" control={control} render={({ field }) => <DatePicker {...field} className="w-full rounded-xl" format="DD MMM YYYY" />} /></AntForm.Item></Col>
                    </Row>
                    <Divider className="my-2 border-slate-50" />
                    <AntForm.Item label="Stay Settings" className="mb-0">
                      <Space orientation="vertical" className="w-full" size="small">
                        <DatePicker.RangePicker className="w-full rounded-xl h-10" format="DD MMM YYYY" onChange={(vals) => { setValue("arrivalDate", vals?.[0]); setValue("departureDate", vals?.[1]); }} />
                        <Controller name="stayType" control={control} render={({ field }) => (
                          <Radio.Group {...field} className="w-full flex" buttonStyle="solid">
                            <Radio.Button value="daily" className="flex-1 text-center h-10 leading-9">Daily</Radio.Button>
                            <Radio.Button value="monthly" className="flex-1 text-center h-10 leading-9">Monthly</Radio.Button>
                          </Radio.Group>
                        )} />
                      </Space>
                    </AntForm.Item>
                  </AntForm>
                </Card>
              </Col>
              <Col span={13}>
                <Card title="Entity Details" variant="borderless" className="rounded-3xl shadow-soft h-full">
                  <AntForm layout="vertical" className="space-y-3">
                    <AntForm.Item label="Customer" required><Controller name="customerName" control={control} render={({ field }) => <Select {...field} placeholder="Select customer..." showSearch options={uniqueCustomers} onChange={handleCustomerChange} className="h-10 w-full" />} /></AntForm.Item>
                    <AntForm.Item label="Vessel" required><Controller name="vesselName" control={control} render={({ field }) => <Select {...field} placeholder="Select vessel..." showSearch options={filteredVessels} onChange={handleVesselChange} className="h-10 w-full" />} /></AntForm.Item>
                    <div className="bg-indigo-50/50 p-4 rounded-2xl flex justify-between gap-2 border border-indigo-100">
                      <div className="text-center flex-1 border-r border-indigo-200">
                        <Text type="secondary" className="block text-[10px] uppercase font-black opacity-60">LOA</Text>
                        <Text strong className="text-lg text-indigo-700">{watchedLoa || '0.00'}m</Text>
                      </div>
                      <div className="text-center flex-1 border-r border-indigo-200">
                        <Text type="secondary" className="block text-[10px] uppercase font-black opacity-60">BEAM</Text>
                        <Text strong className="text-lg text-indigo-700">{watchedBeam || '0.00'}m</Text>
                      </div>
                      <div className="text-center flex-1">
                        <Text type="secondary" className="block text-[10px] uppercase font-black opacity-60">DRAFT</Text>
                        <Text strong className="text-lg text-indigo-700">{watchedDraft || '0.00'}m</Text>
                      </div>
                    </div>
                  </AntForm>
                </Card>
              </Col>
            </Row>

            <Card variant="borderless" title={<div className="flex justify-between items-center"><Space><ShoppingOutlined className="text-indigo-500" /><span className="font-bold">Products/Services</span></Space><Button type="primary" shape="round" ghost icon={<PlusOutlined />} onClick={() => append({ productName: "", qty: calculatedQty, unitPrice: 0, discountType: "percent", discountValue: 0, discountAmount: 0, lineTotal: 0 })}>Add Item</Button></div>} className="rounded-3xl shadow-soft overflow-hidden" styles={{ body: { padding: 0 } }}>
              <Table dataSource={fields} pagination={false} rowKey="id" className="modern-table"
                columns={[
                  { title: "Item", dataIndex: "productName", render: (_, r, i) => <Controller name={`details.${i}.productName` as any} control={control} render={({ field }) => <Select {...field} placeholder="Select..." showSearch options={products.filter(p => p.productType === 'berthing').map(p => ({ label: p.productName, value: p.productName }))} onSelect={(v) => handleProductSelect(v as string, i)} className="w-full" classNames={{ popup: { root: 'rounded-xl' } }} />} /> },
                  { title: "QTY", dataIndex: "qty", width: 80, align: "center", render: (_, r, i) => <Controller name={`details.${i}.qty` as any} control={control} render={({ field }) => <InputNumber {...field} className="w-full rounded-lg" precision={2} />} /> },
                  { title: "Unit price", dataIndex: "unitPrice", width: 110, align: "right", render: (_, r, i) => <Controller name={`details.${i}.unitPrice` as any} control={control} render={({ field }) => <InputNumber {...field} className="w-full text-right" precision={2} />} /> },
                  {
                    title: "Discount", width: 160, render: (_, r, i) => (
                      <Space.Compact className="w-full rounded-lg overflow-hidden border">
                        <Controller name={`details.${i}.discountType` as any} control={control} render={({ field }) => (<Select {...field} className="w-[55px] bg-slate-50 border-none"><Select.Option value="amount">฿</Select.Option><Select.Option value="percent">%</Select.Option></Select>)} />
                        <Controller name={`details.${i}.discountValue` as any} control={control} render={({ field }) => <InputNumber {...field} className="w-full border-none" precision={2} />} />
                      </Space.Compact>
                    )
                  },
                  { title: "Total", dataIndex: "lineTotal", width: 140, align: "right", render: (_, r, i) => <Text strong className="text-indigo-600">{formatCurrency(watchedDetails?.[i]?.lineTotal || 0)}</Text> },
                  { title: "", width: 50, align: "center", render: (_, r, i) => <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(i)} /> }
                ]}
              />
            </Card>
          </Space>
        </Col>

        <Col span={7}>
          <div className="sticky top-6 space-y-6">
            <Card title="Summary" variant="borderless" className="rounded-3xl shadow-lg border border-slate-100">
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                  <div className="flex justify-between items-center mb-2"><Space><PercentageOutlined className="text-orange-500" /><Text strong className="text-orange-800 text-xs">Discount</Text></Space><Controller name="discountType" control={control} render={({ field }) => (<Radio.Group {...field} size="small" buttonStyle="solid" className="compact-radio"><Radio.Button value="amount">฿</Radio.Button><Radio.Button value="percent">%</Radio.Button></Radio.Group>)} /></div>
                  <div className="flex justify-between items-end"><Controller name="discountValue" control={control} render={({ field }) => <InputNumber {...field} className="w-24 rounded-lg" precision={2} />} /><Text className="text-orange-600 font-bold">{formatCurrency(globalDiscountAmountValue)}</Text></div>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="flex justify-between items-center mb-2"><Space><SafetyCertificateOutlined className="text-blue-500" /><Text strong className="text-blue-800 text-xs">Service Charge</Text></Space><Controller name="serviceChargePercent" control={control} render={({ field }) => <InputNumber {...field} size="small" variant="borderless" className="w-10 text-blue-600 font-bold" precision={1} />} /></div>
                  <Text className="block text-right text-blue-600 font-bold">{formatCurrency(serviceChargeAmountValue)}</Text>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="flex justify-between items-center mb-2"><Space><AuditOutlined className="text-emerald-500" /><Text strong className="text-emerald-800 text-xs">VAT (%)</Text></Space><Controller name="vatPercent" control={control} render={({ field }) => <InputNumber {...field} size="small" variant="borderless" className="w-10 text-emerald-600 font-bold" precision={1} />} /></div>
                  <Text className="block text-right text-emerald-600 font-bold">{formatCurrency(vatAmountValue)}</Text>
                </div>
                <div className="p-5 bg-indigo-600 rounded-2xl text-center shadow-lg shadow-indigo-100">
                  <Text className="text-white/60 text-[10px]  font-black tracking-widest block mb-1">Grand Total</Text>
                  <Title level={2} className="m-0 text-white font-black" style={{ color: 'white' }}>{formatCurrency(grandTotalValue)}</Title>
                </div>
              </div>
            </Card>
            <Button block type="primary" size="large" icon={<SaveOutlined />} className="h-14 rounded-2xl bg-indigo-500 font-bold text-lg border-none shadow-xl" onClick={handleSubmit(onFormSubmit as any)} loading={isSubmitting}>Confirm & Save</Button>
          </div>
        </Col>
      </Row>
    </div>
  );
}
