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
import { useRouter, useSearchParams } from "next/navigation";
import { createQuotation, fetchVesselRelations, fetchProducts, fetchBerthPrices, fetchBooking } from "@/lib/api";
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
  productId: z.number().optional(),
  productName: z.string().min(1, "Required"),
  qty: z.number().min(0.01, "Min 0.01"),
  unitPrice: z.number().min(0),
  discountType: z.enum(["amount", "percent"]).default("percent"),
  discountValue: z.number().default(0),
  discountAmount: z.number().default(0),
  lineTotal: z.number(),
});

const quotationFormSchema = z.object({
  quNo: z.string().min(1, "Quotation No is required"),
  quDate: z.any(),
  arrivalDate: z.any().optional(),
  departureDate: z.any().optional(),
  stayType: z.enum(["daily", "monthly"]).default("daily"),
  customerName: z.string().min(1, "Customer is required"),
  customerId: z.number(),
  vesselId: z.number().optional(),
  vesselName: z.string().optional(),
  mainVesselLoa: z.number(),
  beam: z.number(),
  draft: z.number(),
  status: z.string(),
  refBookingId: z.number().optional(),
  refBookingNo: z.string().optional(),
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

type QuotationFormValues = z.infer<typeof quotationFormSchema>;

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

export default function CreateQuotation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const [isMounted, setIsMounted] = React.useState(false);
  const [relations, setRelations] = React.useState<VesselRelation[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [berthPrices, setBerthPrices] = React.useState<BerthPrice[]>([]);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema) as any,
    defaultValues: {
      quNo: "",
      quDate: dayjs(),
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

        if (bookingId) {
          const booking = await fetchBooking(bookingId);
          if (booking) {
            reset({
              quNo: `QU-${dayjs().format("YYYYMMDD-HHmm")}`,
              quDate: dayjs(),
              customerName: booking.customer_name || booking.customerName,
              customerId: booking.customer_id || booking.customerId,
              vesselId: booking.vessel_id || booking.vesselId,
              vesselName: booking.vessel_name || booking.vesselName,
              mainVesselLoa: Number(booking.main_vessel_loa || booking.mainVesselLoa || 0),
              beam: Number(booking.beam || 0),
              draft: Number(booking.draft || 0),
              arrivalDate: booking.arrival_date ? dayjs(booking.arrival_date) : undefined,
              departureDate: booking.departure_date ? dayjs(booking.departure_date) : undefined,
              stayType: (booking.stay_type || booking.stayType || "daily").toLowerCase() as any,
              refBookingId: Number(booking.booking_id || booking.bookingId),
              refBookingNo: booking.booking_no || booking.bookingNo,
              status: "draft",
              details: (booking.details || []).map((d: any) => ({
                productId: d.product_id || d.productId,
                productName: d.product_name || d.productName,
                qty: Number(d.quantity || d.qty || 1),
                unitPrice: Number(d.unit_price || d.unitPrice || 0),
                discountType: "amount",
                discountValue: Number(d.discount_amount || 0),
                discountAmount: Number(d.discount_amount || 0),
                lineTotal: Number(d.total_price || d.lineTotal || 0)
              })),
              totalItems: Number(booking.total_item_before_discount || booking.totalItems || 0),
              discountType: "amount",
              discountValue: Number(booking.discount_amount || 0),
              discountAmount: Number(booking.discount_amount || 0),
              serviceChargePercent: Number(booking.serviceChargePercent || 10),
              serviceChargeAmount: Number(booking.service_charge_amount || booking.serviceChargeAmount || 0),
              vatPercent: Number(booking.vatPercent || 7),
              vatAmount: Number(booking.vat_amount || booking.vatAmount || 0),
              grandTotal: Number(booking.grand_total || booking.grandTotal || 0),
            });
          }
        }
      } catch (err) {
        console.error("Failed to load data", err);
      }
    };
    loadData();
  }, [bookingId, reset]);

  useEffect(() => {
    if (isMounted) {
      setValue("quNo", `QU-${dayjs().format("YYYYMMDD-HHmm")}`);
      setValue("quDate", dayjs());
    }
  }, [isMounted, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "details" as never,
  });

  // --- Watchers ---
  const watchedCustomerName = useWatch({ control, name: "customerName" });
  const watchedDetails = useWatch({ control, name: "details" });
  const watchedLoa = useWatch({ control, name: "mainVesselLoa" });
  const watchedBeam = useWatch({ control, name: "beam" });
  const watchedDraft = useWatch({ control, name: "draft" });
  const watchedStayType = useWatch({ control, name: "stayType" });
  const watchedArrivalDate = useWatch({ control, name: "arrivalDate" });
  const watchedDepartureDate = useWatch({ control, name: "departureDate" });
  const totalItemsValue = useWatch({ control, name: "totalItems" }) || 0;
  const globalDiscountType = useWatch({ control, name: "discountType" }) || "percent";
  const globalDiscountValue = useWatch({ control, name: "discountValue" }) || 0;
  const globalDiscountAmountValue = useWatch({ control, name: "discountAmount" }) || 0;
  const serviceChargePercentValue = useWatch({ control, name: "serviceChargePercent" }) ?? 10;
  const serviceChargeAmountValue = useWatch({ control, name: "serviceChargeAmount" }) || 0;
  const vatPercentValue = useWatch({ control, name: "vatPercent" }) ?? 7;
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

  const onFormSubmit = async (data: QuotationFormValues) => {
    try {
      const payload = {
        qu_no: data.quNo,
        qu_date: data.quDate?.toISOString(),
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
        ref_booking_id: data.refBookingId,
        ref_booking_no: data.refBookingNo,
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

      await createQuotation(payload);
      message.success("Quotation saved successfully");
      router.push("/quotation");
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
          <Link href="/quotation"><Button icon={<ArrowLeftOutlined />} shape="circle" /></Link>
          <div><Title level={2} className="m-0 text-slate-800 font-bold">New Quotation</Title><Text type="secondary">Generate a formal pricing proposal</Text></div>
        </Space>
        <Space size="small"><Button onClick={() => router.push("/quotation")} className="rounded-xl border-slate-200">Cancel</Button></Space>
      </div>

      <Row gutter={32}>
        <Col span={17}>
          <Space orientation="vertical" size="large" className="w-full">
            <Row gutter={24}>
              <Col span={11}>
                <Card title="Quotation Info" variant="borderless" className="rounded-3xl shadow-soft">
                  <AntForm layout="vertical" className="space-y-4">
                    <Row gutter={12}>
                      <Col span={10}><AntForm.Item label="ID" className="mb-0"><Controller name="quNo" control={control} render={({ field }) => <Tag color="indigo" className="px-4 py-1 text-base font-mono rounded-lg w-full">{field.value || '...'}</Tag>} /></AntForm.Item></Col>
                      <Col span={14}><AntForm.Item label="Date" className="mb-0"><Controller name="quDate" control={control} render={({ field }) => <DatePicker {...field} className="w-full rounded-xl" format="DD/MM/YYYY" />} /></AntForm.Item></Col>
                    </Row>
                    <Divider className="my-2 border-slate-50" />
                    <AntForm.Item label="Validity Settings" className="mb-0">
                      <Space orientation="vertical" className="w-full" size="small">
                        <DatePicker.RangePicker className="w-full rounded-xl h-10" format="DD/MM/YYYY" onChange={(vals) => { setValue("arrivalDate", vals?.[0]); setValue("departureDate", vals?.[1]); }} />
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
                    <div className="bg-slate-50/80 p-4 rounded-2xl flex justify-between gap-2 border border-slate-100">
                      <div className="text-center flex-1 border-r border-slate-200">
                        <Text type="secondary" className="block text-[10px] font-black opacity-60">LOA</Text>
                        <Text strong className="text-lg text-slate-700">{watchedLoa || '0.00'}m</Text>
                      </div>
                      <div className="text-center flex-1 border-r border-slate-200">
                        <Text type="secondary" className="block text-[10px] font-black opacity-60">BEAM</Text>
                        <Text strong className="text-lg text-slate-700">{watchedBeam || '0.00'}m</Text>
                      </div>
                      <div className="text-center flex-1">
                        <Text type="secondary" className="block text-[10px] font-black opacity-60">DRAFT</Text>
                        <Text strong className="text-lg text-slate-700">{watchedDraft || '0.00'}m</Text>
                      </div>
                    </div>
                  </AntForm>
                </Card>
              </Col>
            </Row>

            <Card variant="borderless" title={<div className="flex justify-between items-center"><Space><ShoppingOutlined className="text-indigo-500" /><span className="font-bold">Products/Services</span></Space><Button type="primary" shape="round" ghost icon={<PlusOutlined />} onClick={() => append({ productName: "", qty: calculatedQty, unitPrice: 0, discountType: "percent", discountValue: 0, discountAmount: 0, lineTotal: 0 })}>Add Item</Button></div>} className="rounded-3xl shadow-soft overflow-hidden" styles={{ body: { padding: 0 } }}>
              <Table dataSource={fields} pagination={false} rowKey="id" className="modern-table"
                columns={[
                  { title: "Item", dataIndex: "productName", render: (_, r, i) => <Controller name={`details.${i}.productName` as any} control={control} render={({ field }) => <Select {...field} placeholder="Select item..." showSearch options={products.filter(p => p.productType === 'berthing').map(p => ({ label: p.productName, value: p.productName }))} onSelect={(v) => handleProductSelect(v as string, i)} className="w-full" classNames={{ popup: { root: 'rounded-xl' } }} />} /> },
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
                  <div className="flex justify-between items-center mb-2"><Space><PercentageOutlined className="text-orange-500" /><Text strong className="text-orange-800 text-xs text-nowrap">Discount</Text></Space><Controller name="discountType" control={control} render={({ field }) => (<Radio.Group {...field} size="small" buttonStyle="solid" className="compact-radio"><Radio.Button value="amount">฿</Radio.Button><Radio.Button value="percent">%</Radio.Button></Radio.Group>)} /></div>
                  <div className="flex justify-between items-end"><Controller name="discountValue" control={control} render={({ field }) => <InputNumber {...field} className="w-24 rounded-lg" precision={2} />} /><Text className="text-orange-600 font-bold">{formatCurrency(globalDiscountAmountValue)}</Text></div>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="flex justify-between items-center mb-2">
                    <Space>
                      <SafetyCertificateOutlined className="text-blue-500" />
                      <Text strong className="text-blue-800 text-xs text-nowrap">Service Charge (%)</Text>
                    </Space>
                    <Controller 
                      name="serviceChargePercent" 
                      control={control} 
                      render={({ field }) => (
                        <InputNumber 
                          {...field} 
                          size="small" 
                          className="w-16 rounded-lg text-blue-600 font-bold border-blue-200" 
                          precision={2} 
                          step={0.5}
                          suffix="%"
                        />
                      )} 
                    />
                  </div>
                  <Text className="block text-right text-blue-600 font-bold">{formatCurrency(serviceChargeAmountValue)}</Text>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="flex justify-between items-center mb-2">
                    <Space>
                      <AuditOutlined className="text-emerald-500" />
                      <Text strong className="text-emerald-800 text-xs text-nowrap">VAT (%)</Text>
                    </Space>
                    <Controller 
                      name="vatPercent" 
                      control={control} 
                      render={({ field }) => (
                        <InputNumber 
                          {...field} 
                          size="small" 
                          className="w-16 rounded-lg text-emerald-600 font-bold border-emerald-200" 
                          precision={2} 
                          step={1}
                          suffix="%"
                        />
                      )} 
                    />
                  </div>
                  <Text className="block text-right text-emerald-600 font-bold">{formatCurrency(vatAmountValue)}</Text>
                </div>
                <div className="p-5 bg-indigo-600 rounded-2xl text-center shadow-lg shadow-indigo-100">
                  <Text className="text-white/60 text-[10px] font-black tracking-widest block mb-1">Grand Total</Text>
                  <Title level={2} className="m-0 text-white font-black" style={{ color: 'white' }}>{formatCurrency(grandTotalValue)}</Title>
                </div>
              </div>
            </Card>
            <Button block type="primary" size="large" icon={<SaveOutlined />} className="h-14 rounded-2xl bg-indigo-600 font-bold text-lg border-none shadow-xl" onClick={handleSubmit(onFormSubmit as any)} loading={isSubmitting}>Save Quotation</Button>
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
        .compact-radio .ant-radio-button-wrapper {
          border-radius: 8px !important;
          border: none !important;
          background: #f1f5f9 !important;
          color: #64748b !important;
          font-weight: 700 !important;
          font-size: 10px !important;
          margin-left: 4px;
        }
        .compact-radio .ant-radio-button-wrapper-checked {
          background: #f97316 !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
}
