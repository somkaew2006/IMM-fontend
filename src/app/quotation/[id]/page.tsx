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
  Tooltip,
  Modal,
  Form,
  Select,
  DatePicker,
  Input
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
  ShoppingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BankOutlined,
  CreditCardOutlined,
  WalletOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchQuotation, deleteQuotation, fetchMasterTenders, createRV } from "@/lib/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface QuotationDetail {
  quDetailId: number;
  productId: number;
  productName: string;
  product_name?: string;
  qty: number;
  quantity?: number;
  unitPrice: number;
  unit_price?: number;
  discount_amount: number;
  total_price: number;
}

interface Quotation {
  quId: number;
  quNo: string;
  qu_no?: string;
  quDate: string;
  qu_date?: string;
  status: string;
  customerName: string;
  customer_id?: number;
  customerId?: number;
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
  refBookingNo?: string;
  ref_booking_no?: string;
  refBookingId?: number;
  ref_booking_id?: number;
  details: QuotationDetail[];
}

interface Tender {
  tenderId: number;
  tenderCode: string;
  tenderName: string;
}

export default function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const [data, setData] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  
  // RV State
  const [isRVModalOpen, setIsRVModalOpen] = useState(false);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [isCreatingRV, setIsCreatingRV] = useState(false);
  const [createdRV, setCreatedRV] = useState<any>(null);
  const [rvForm] = Form.useForm();

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const [qData, tenderData] = await Promise.all([
          fetchQuotation(id),
          fetchMasterTenders()
        ]);
        setData(qData);
        // Handle both array and wrapped object ({value: [], Count: 0})
        setTenders(Array.isArray(tenderData) ? tenderData : (tenderData.value || []));
      } catch (err: any) {
        messageApi.error(err.message || "Could not load data");
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [id, messageApi]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteQuotation(id);
      messageApi.success("Quotation deleted successfully");
      router.push("/quotation");
    } catch (err: any) {
      messageApi.error(err.message || "Failed to delete quotation");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenRVModal = () => {
    if (!data) return;
    rvForm.setFieldsValue({
      receiveAmount: data.grand_total || data.grandTotal,
      rvDate: dayjs(),
      tenderId: tenders[0]?.tenderId
    });
    setIsRVModalOpen(true);
  };

  const handleConfirmRV = async (values: any) => {
    if (!data) return;
    setIsCreatingRV(true);
    try {
      const selectedTender = tenders.find(t => t.tenderId === values.tenderId);
      const qId = data.quId || (data as any).qu_id;
      const qNoActual = data.qu_no || data.quNo;
      const customerIdActual = data.customer_id || data.customerId || (data as any).customer?.customerId;
      
      if (!customerIdActual) {
        messageApi.error("Customer ID is missing. Cannot create RV.");
        setIsCreatingRV(false);
        return;
      }

      if (!values.tenderId) {
        messageApi.error("Please select a payment method (Tender).");
        setIsCreatingRV(false);
        return;
      }

      const payload: any = {
        customerId: Number(customerIdActual),
        receiveAmount: Number(values.receiveAmount),
        rvDate: values.rvDate.toDate(),
        receiveDate: values.rvDate.toDate(),
        tenderId: Number(values.tenderId),
        tenderCode: selectedTender?.tenderCode,
        refQuId: Number(qId),
        note: values.note || `RV for ${qNoActual}`
      };

      if (values.cardType) payload.cardType = values.cardType;
      if (values.cardLast4) payload.cardLast4 = values.cardLast4;
      
      console.log("Creating RV with payload:", payload);
      if (isNaN(payload.customerId) || isNaN(payload.tenderId)) {
        throw new Error("Invalid Customer or Tender ID (NaN detected)");
      }
      
      const result = await createRV(payload);
      setCreatedRV(result);
      messageApi.success("Receipt Voucher (RV) created successfully!");
      setIsRVModalOpen(false);
    } catch (err: any) {
      console.error("RV Creation Error:", err);
      messageApi.error(err.message || "Failed to create RV");
    } finally {
      setIsCreatingRV(false);
    }
  };

  const formatCurrency = (val: any) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);
  };

  const handlePrint = () => {
    document.body.classList.add('printing-qu');
    window.print();
    setTimeout(() => document.body.classList.remove('printing-qu'), 500);
  };

  const handlePrintRV = () => {
    document.body.classList.add('printing-rv');
    window.print();
    setTimeout(() => document.body.classList.remove('printing-rv'), 500);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#f8fafc]"><Spin size="large" description="Loading quotation details..." /></div>;

  if (!data) return <div className="p-10 text-center bg-[#f8fafc] min-h-screen"><Card variant="borderless" className="shadow-soft max-w-md mx-auto rounded-3xl"><Title level={4}>Quotation Missing</Title><Link href="/quotation"><Button type="primary" shape="round">Return to List</Button></Link></Card></div>;

  // normalizing data keys
  const qNo = data.qu_no || data.quNo || "";
  const qId = data.quId || (data as any).qu_id;
  const qDate = data.qu_date || data.quDate;
  const cName = data.customer_name || data.customerName || "N/A";
  const vName = data.vessel_name || data.vesselName || "N/A";
  const loa = Number(data.main_vessel_loa || data.mainVesselLoa || 0);
  const stay = data.stay_type || data.stayType;
  const arrival = data.arrival_date || data.arrivalDate;
  const departure = data.departure_date || data.departureDate;
  
  // Totals normalization
  const totalItemBefore = Number(data.total_item_before_discount || data.totalItemBeforeDiscount || 0);
  const discAmt = Number(data.final_discount_amount || data.finalDiscountAmount || data.discount_amount || data.discountAmount || 0);
  const scAmt = Number(data.service_charge || data.serviceCharge || data.service_charge_amount || data.serviceChargeAmount || 0);
  const vtAmt = Number(data.vat_amount || data.vatAmount || 0);
  const gTotal = Number(data.grand_total || data.grandTotal || 0);
  
  const refNo = data.ref_booking_no || data.refBookingNo;
  const refId = data.ref_booking_id || data.refBookingId;
  const cId = data.customer_id || data.customerId || (data as any).customer?.customerId;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-700 bg-[#f8fafc] min-h-screen">
      {contextHolder}
      {/* Printable Area (Hidden in UI) */}
      <div id="quotation-print-area" className="hidden-print-preview">
        <div className="print-header">
          <div className="header-left">
            <img src="https://www.pyhmarina.com/wp-content/uploads/2021/04/pyh-logo-new.png" alt="Logo" className="print-logo" />
            <div className="company-info-th">
              บริษัท ภูเก็ตไอแลนด์มารีน่า จำกัด (สำนักงานใหญ่)
              <br />
              141/2 หมู่ 2 ตำบลไม้ขาว อำเภอถลาง จังหวัดภูเก็ต 83110
              <br />
              โทรศัพท์ +66 76 397 908-10 โทรสาร +66 76 397 911
            </div>
          </div>
          <div className="header-right text-right">
            <div className="company-name-en">Phuket Island Marina Co., Ltd</div>
            <div className="company-info-en">
              Head Office: 141/2 Moo 2, Tumbol Maikhao,
              <br />
              Amphur Thalang, Phuket 83110 Thailand
              <br />
              Tel: +66 76 397 908-10 Fax: +66 76 397 911
              <br />
              E-mail: info@pyhmarina.com
              <br />
              Website: www.pyhmarina.com
            </div>
          </div>
        </div>

        <div className="print-divider"></div>
        <div className="print-title">Quotation Document</div>

        <div className="print-meta-grid">
          <div className="meta-left">
            <div className="meta-row"><span className="label">Customer</span><span className="value">: {cName}</span></div>
            <div className="meta-row"><span className="label">Vessel Name</span><span className="value">: {vName}</span></div>
            <div className="meta-row"><span className="label">Vessel Type</span><span className="value">: {data.stayType || 'Catamaran'}</span></div>
            <div className="meta-row"><span className="label">LOA</span><span className="value">: {loa} m</span></div>
            <div className="meta-row"><span className="label">Arrival date</span><span className="value">: {arrival ? dayjs(arrival).format("DD/MM/YYYY") : '-'}</span></div>
            <div className="meta-row"><span className="label">Departure date</span><span className="value">: {departure ? dayjs(departure).format("DD/MM/YYYY") : '-'}</span></div>
            <div className="meta-row"><span className="label">Stay type</span><span className="value">: {stay ? stay.charAt(0).toUpperCase() + stay.slice(1) : 'Daily'}</span></div>
          </div>
          <div className="meta-right">
            <div className="meta-row"><span className="label">Document No</span><span className="value">: {qNo}</span></div>
            <div className="meta-row"><span className="label">Date</span><span className="value">: {dayjs(qDate).format("DD/MM/YYYY")}</span></div>
            <div className="meta-row"><span className="label">Valid Until</span><span className="value">: {departure ? dayjs(departure).format("DD/MM/YYYY") : dayjs(qDate).add(7, 'day').format("DD/MM/YYYY")}</span></div>
          </div>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Description</th>
              <th>LOA</th>
              <th>Qty</th>
              <th className="text-center">Unit Price</th>
              <th className="text-right">Gross Amount</th>
              <th className="text-right">Discount</th>
              <th className="text-right">Net Amount</th>
            </tr>
          </thead>
          <tbody>
            {(data.details || []).map((item, idx) => (
              <tr key={idx}>
                <td className="text-center">{idx + 1}</td>
                <td>{item.productName || item.product_name || "N/A"}</td>
                <td className="text-center">{formatCurrency(item.loa || loa)}</td>
                <td className="text-center">{item.qty || item.quantity || 0}</td>
                <td className="text-right">{formatCurrency(item.unitPrice || item.unit_price || 0)}</td>
                <td className="text-right">{formatCurrency((Number(item.unitPrice || item.unit_price || 0)) * (Number(item.qty || item.quantity || 1)) * (Number(item.loa || loa || 1)))}</td>
                <td className="text-right">{formatCurrency(item.discountAmount || item.discount_amount || 0)}</td>
                <td className="text-right">{formatCurrency(item.lineTotal || item.total_price || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="print-summary">
          <div className="summary-wrapper">
            <div className="summary-row"><span className="label">Net Amount</span><span className="value">: {formatCurrency(totalItemBefore - discAmt)}</span></div>
            <div className="summary-row"><span className="label">Service Charge (10%)</span><span className="value">: {formatCurrency(scAmt)}</span></div>
            <div className="summary-row"><span className="label">Vat (7%)</span><span className="value">: {formatCurrency(vtAmt)}</span></div>
            <div className="summary-row grand-total"><span className="label">Grand Total</span><span className="value">: {formatCurrency(gTotal)}</span></div>
          </div>
        </div>

        <div className="print-footer-box">
          <div className="due-info">
            <span>Total Due to be paid by</span>
            <span className="bold">{dayjs(qDate).format("DD/MM/YYYY")}</span>
          </div>
          <div className="amount-info">
            <span>Amount Due:</span>
            <span className="bold">{formatCurrency(gTotal)}</span>
          </div>
        </div>

        <div className="print-legal-footer">
          <div className="legal-left">
            <div className="bold">Phuket Island Marina Co., Ltd (Head Office)</div>
            <div>{cName}</div>
            <br />
            <div className="small-text">
              Phuket Island Marina Co., Ltd (Head Office)
              <br />
              141/2 Moo 2 Tumbol Maikhao
              <br />
              Amphur Thalang, Phuket 83110, Thailand
              <br />
              Tax ID No. 0835544000592
            </div>
          </div>
          <div className="legal-right text-right">
            <div className="bold">DSI RR 140595</div>
            <br />
            <div className="small-text italic">
              This account is payable within 7 days of
              <br />
              this invoice. For Cheque Payment please
              <br />
              ensure crossed cheque payable to
              <br />
              "Phuket Island Marina Co Ltd"
            </div>
          </div>
        </div>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 no-print">
        <Space size="middle">
          <Link href="/quotation"><Button icon={<ArrowLeftOutlined />} shape="circle" className="border-slate-200" /></Link>
          <div>
            <div className="flex items-center gap-3">
              <Title level={2} className="m-0 text-slate-800 font-bold">{qNo}</Title>
              <Tag color={['confirmed', 'approved', 'complete'].includes(data.status?.toLowerCase() || '') ? 'success' : 'processing'} className="rounded-full px-4 border-none font-bold uppercase text-[10px] tracking-wider mb-1">
                {data.status || 'DRAFT'}
              </Tag>
              {refNo && (
                <Tag color="geekblue" className="rounded-full px-3 border-none font-bold text-[10px] mb-1">
                  REF: {refNo}
                </Tag>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Text type="secondary" className="flex items-center gap-1 text-[11px]"><CalendarOutlined /> Proposal Date: {dayjs(qDate).format("DD/MM/YYYY")}</Text>
              {refId && <Text className="text-[11px] text-slate-300 font-mono">Ref ID: {refId}</Text>}
            </div>
          </div>
        </Space>

        <Space size="middle">
          <Button icon={<PrinterOutlined />} className="rounded-xl border-slate-200" onClick={handlePrint}>Print QU</Button>
          {createdRV && (
             <Button type="primary" icon={<FileTextOutlined />} className="rounded-xl bg-green-600 border-none shadow-md" onClick={handlePrintRV}>Print RV</Button>
          )}
          <Divider orientation="vertical" className="h-8 border-slate-100" />
          
          {data.status?.toLowerCase() !== 'complete' && (
            <>
              <Tooltip title="Create a Receipt Voucher from this quotation">
                <Button type="primary" icon={<CheckCircleOutlined />} className="rounded-xl bg-indigo-600 shadow-md border-none px-6" onClick={handleOpenRVModal}>Create RV</Button>
              </Tooltip>
              <Popconfirm title="Cancel Quotation" description="Are you sure you want to cancel this quotation?" onConfirm={handleDelete} okText="Yes, Cancel" okButtonProps={{ danger: true, loading: deleting }}>
                <Button danger icon={<CloseCircleOutlined />} type="text" className="hover:bg-red-50 text-red-500">Cancel</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      </div>

      <Modal
        title={<Title level={4}>Create Receipt Voucher</Title>}
        open={isRVModalOpen}
        onCancel={() => setIsRVModalOpen(false)}
        footer={[
          <Button key="back" onClick={() => setIsRVModalOpen(false)}>Cancel</Button>,
          <Button key="submit" type="primary" loading={isCreatingRV} onClick={() => rvForm.submit()} className="bg-indigo-600">Create & Confirm</Button>,
        ]}
        className="rounded-3xl"
      >
        <Form form={rvForm} layout="vertical" onFinish={handleConfirmRV}>
          <Form.Item label="Payment Date" name="rvDate" rules={[{ required: true }]}>
            <DatePicker className="w-full h-10 rounded-xl" format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item label="Select Tender (Payment Method)" name="tenderId" rules={[{ required: true }]}>
            <Select className="w-full h-10 rounded-xl" placeholder="Select payment method">
              {tenders.map(t => (
                <Select.Option key={t.tenderId} value={t.tenderId}>
                  <Space>
                    {t.tenderName.toLowerCase().includes('cash') ? <WalletOutlined /> : <CreditCardOutlined />}
                    {t.tenderName} ({t.tenderCode})
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item noStyle dependencies={["tenderId"]}>
            {({ getFieldValue }) => {
              const selectedTenderId = getFieldValue("tenderId");
              const selectedTender = tenders.find(t => t.tenderId === selectedTenderId);
              const isCreditCard = selectedTender?.tenderName.toLowerCase().includes("credit");
              
              if (isCreditCard) {
                return (
                  <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100 animate-in slide-in-from-top-2 duration-300">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="Card Type" name="cardType" rules={[{ required: true, message: "Select card type" }]} className="mb-0">
                          <Select className="w-full h-10 rounded-xl" placeholder="Select type">
                            <Select.Option value="Visa">Visa</Select.Option>
                            <Select.Option value="Mastercard">Mastercard</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Last 4 Digits" name="cardLast4" rules={[{ required: true, len: 4, message: "Enter 4 digits" }]} className="mb-0">
                          <Input className="h-10 rounded-xl" maxLength={4} placeholder="xxxx" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                );
              }
              return null;
            }}
          </Form.Item>
          <Form.Item label="Received Amount" name="receiveAmount" rules={[{ required: true }]}>
            <Input type="number" step="0.01" className="h-10 rounded-xl" prefix="฿" />
          </Form.Item>
          <Form.Item label="Notes (Optional)" name="note">
            <Input.TextArea className="rounded-xl" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {createdRV && (
        <div id="rv-print-area" className="hidden-print-preview">
           <div className="print-header">
              <div className="header-left">
                 <img src="https://www.pyhmarina.com/wp-content/uploads/2021/04/pyh-logo-new.png" alt="Logo" className="print-logo" />
                 <div className="company-info-th">บริษัท ภูเก็ตไอแลนด์มารีน่า จำกัด (สำนักงานใหญ่)</div>
              </div>
              <div className="header-right text-right">
                 <div className="company-name-en">Phuket Island Marina Co., Ltd</div>
                 <div className="company-info-en">Receipt Voucher Document</div>
              </div>
           </div>
           
           <div className="print-divider"></div>
           <div className="print-title">Receipt Voucher</div>

           <div className="print-meta-grid">
              <div className="meta-left">
                 <div className="meta-row"><span className="label">Customer</span><span className="value">: {cName}</span></div>
                 <div className="meta-row"><span className="label">RV Date</span><span className="value">: {dayjs(createdRV.rvDate).format("DD/MM/YYYY")}</span></div>
                 <div className="meta-row"><span className="label">Ref QU</span><span className="value">: {createdRV.refQuNo}</span></div>
              </div>
              <div className="meta-right">
                 <div className="meta-row"><span className="label">Voucher No</span><span className="value">: {createdRV.rvNo}</span></div>
                 <div className="meta-row"><span className="label">Payment Type</span><span className="value">: {tenders.find(t => t.tenderId === createdRV.tenderId)?.tenderName || 'Tender'}</span></div>
                 <div className="meta-row"><span className="label">Status</span><span className="value">: {createdRV.status}</span></div>
              </div>
           </div>

           <div className="rv-amount-box">
              <div className="flex justify-between items-center p-6 border border-slate-300 rounded-lg">
                 <span className="bold text-lg text-blue-600">Total Received Amount:</span>
                 <span className="bold text-2xl text-slate-800">฿ {formatCurrency(createdRV.receiveAmount)}</span>
              </div>
           </div>

           <div className="print-legal-footer mt-20">
              <div className="text-center w-48 border-t border-slate-300 pt-2">
                 <div className="small-text">(........................................)</div>
                 <div className="small-text mt-1">Authorized Person</div>
              </div>
              <div className="text-center w-48 border-t border-slate-300 pt-2">
                 <div className="small-text">(........................................)</div>
                 <div className="small-text mt-1">Customer Signature</div>
              </div>
           </div>
        </div>
      )}

      <Row gutter={32} className="no-print">
        <Col span={17}>
          <Space orientation="vertical" size="large" className="w-full">
            <Row gutter={24}>
              <Col span={10}>
                <Card title={<Space><CalendarOutlined className="text-indigo-500" />Proposal Validity</Space>} variant="borderless" className="rounded-3xl shadow-soft h-full">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <Text type="secondary" className="text-[10px] font-black opacity-50">Arrival</Text>
                        <Text strong className="text-lg">{arrival ? dayjs(arrival).format("DD/MM/YYYY") : "Not Set"}</Text>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center"><ArrowLeftOutlined className="rotate-180 text-slate-300" /></div>
                      <div className="flex flex-col text-right">
                        <Text type="secondary" className="text-[10px] font-black opacity-50">Departure</Text>
                        <Text strong className="text-lg">{departure ? dayjs(departure).format("DD/MM/YYYY") : "Not Set"}</Text>
                      </div>
                    </div>
                    <Divider className="my-0 border-slate-50" />
                    <div>
                      <Text type="secondary" className="text-[10px] font-black opacity-50 block mb-2">Rate Type</Text>
                      <Tag color={stay === 'monthly' ? 'blue' : 'cyan'} className="rounded-full px-4 py-1 border-none font-bold text-xs">
                        {stay?.toUpperCase() || 'DAILY'}
                      </Tag>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={14}>
                <Card title={<Space><CompassOutlined className="text-indigo-500" />Client & Vessel</Space>} variant="borderless" className="rounded-3xl shadow-soft h-full">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                        <UserOutlined className="text-indigo-500 text-xl" />
                      </div>
                      <div>
                        <Text type="secondary" className="text-[10px] font-black opacity-50 block">Customer</Text>
                        <Text strong className="text-base text-slate-800">{cName}</Text>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center">
                        <CompassOutlined className="text-slate-400 text-xl" />
                      </div>
                      <div>
                        <Text type="secondary" className="text-[10px] font-black opacity-50 block">Vessel Name</Text>
                        <Text strong className="text-base text-slate-800">{vName || "No vessel name"}</Text>
                      </div>
                    </div>
                    <div className="bg-slate-50/80 p-5 rounded-2xl flex justify-between gap-4 border border-slate-100">
                      <div className="text-center flex-1 border-r border-slate-200">
                        <Text type="secondary" className="block text-[10px] font-black opacity-40">LOA</Text>
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
              <Table dataSource={data.details} pagination={false} rowKey={(r) => r.quDetailId || r.product_name || Math.random()} className="modern-table"
                columns={[
                  { title: "Item Description", dataIndex: "productName", render: (t, r) => <Text strong className="text-slate-700">{t || r.product_name}</Text> },
                  { title: "QTY", dataIndex: "qty", width: 90, align: "center", render: (v, r) => <Text className="text-slate-600 font-medium">{v || r.qty || 0}</Text> },
                  { title: "Unit Price", dataIndex: "unitPrice", width: 140, align: "right", render: (v, r) => <Text className="text-slate-600 font-medium">{formatCurrency(v || r.unit_price)}</Text> },
                  { title: "Discount", width: 140, align: "right", render: (_, r) => <Text className="text-orange-600 font-bold">{formatCurrency(r.discount_amount)}</Text> },
                  { title: "Subtotal", dataIndex: "total_price", width: 160, align: "right", render: (v, r) => <Text strong className="text-indigo-600 text-base">{formatCurrency(v || r.total_price)}</Text> }
                ]}
              />
            </Card>
          </Space>
        </Col>

        <Col span={7} className="no-print">
          <div className="sticky top-6 space-y-6">
            <Card title={<span className="text-xs font-black tracking-widest text-slate-400">Total Calculation</span>} variant="borderless" className="rounded-3xl shadow-lg border border-slate-100">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs px-2">
                  <Text type="secondary">Gross Amount</Text>
                  <Text strong className="text-slate-700">{formatCurrency(totalItemBefore)}</Text>
                </div>
                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex justify-between items-center">
                  <Space><PercentageOutlined className="text-orange-500" /><Text strong className="text-orange-800 text-xs">Global Discount</Text></Space>
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
                  <Text className="text-white/60 text-[10px] font-black tracking-widest block mb-1">Grand Total</Text>
                  <Title level={2} className="m-0 text-white font-black" style={{ color: 'white' }}>{formatCurrency(gTotal)}</Title>
                </div>
              </div>
            </Card>
            <Link href="/quotation">
              <Button block size="large" className="rounded-2xl h-14 border-slate-200 text-slate-400 hover:text-indigo-600 font-medium">Return to List</Button>
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

        /* Print Styles */
        .hidden-print-preview { display: none; }
        
        @media print {
          @page { margin: 10mm; size: A4; }
          body { background: white !important; }
          .no-print { display: none !important; }
          body > :not(#quotation-print-area):not(#rv-print-area) { display: none !important; }

          #quotation-print-area, #rv-print-area {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0px;
            background: white;
            color: #1e293b;
            font-family: 'Inter', sans-serif;
            font-size: 10.5px;
            line-height: 1.2;
            visibility: visible !important;
          }

          /* Ensure only one is printed at a time */
          #quotation-print-area { display: none !important; }
          #rv-print-area { display: none !important; }
          
          body.printing-qu #quotation-print-area { display: block !important; }
          body.printing-rv #rv-print-area { display: block !important; }

          .print-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
          .print-logo { width: 140px; margin-bottom: 5px; }
          .company-info-th { font-size: 9px; line-height: 1.2; color: #475569; }
          .company-name-en { font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 2px; }
          .company-info-en { font-size: 8.5px; line-height: 1.2; color: #64748b; }
          
          .print-divider { border-bottom: 1.5px solid #2563eb; margin: 8px 0; }
          .print-title { text-align: center; font-size: 15px; font-weight: 800; color: #2563eb; text-transform: uppercase; margin-bottom: 15px; }
          
          .print-meta-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; margin-bottom: 15px; }
          .meta-row { display: flex; margin-bottom: 3px; }
          .meta-row .label { width: 90px; font-weight: 700; color: #2563eb; }
          .meta-row .value { flex: 1; color: #0f172a; }
          
          .print-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; table-layout: fixed; }
          .print-table th { 
            background: #f8fbff; 
            border: 0.5px solid #cbd5e1; 
            padding: 6px 8px; 
            color: #2563eb; 
            font-size: 9px; 
            text-transform: uppercase;
            text-align: left;
          }
          .print-table td { border: 0.5px solid #e2e8f0; padding: 6px 8px; font-size: 9px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          
          .print-summary { display: flex; justify-content: flex-end; margin-bottom: 15px; page-break-inside: avoid; }
          .summary-wrapper { width: 250px; }
          .summary-row { display: flex; justify-content: space-between; margin-bottom: 3px; padding: 2px 0; }
          .summary-row .label { font-weight: 700; color: #2563eb; }
          .summary-row.grand-total { border-top: 1px solid #cbd5e1; padding-top: 6px; margin-top: 4px; font-size: 12px; }
          .summary-row.grand-total .value { font-weight: 800; color: #0f172a; }

          .print-footer-box { 
            border: 1px solid #334155; 
            background: #f8fafc; 
            padding: 8px 15px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            margin-bottom: 15px;
            page-break-inside: avoid;
          }
          .due-info { display: flex; gap: 8px; font-size: 10px; }
          .amount-info { font-size: 10px; }
          .bold { font-weight: 800; }
          .italic { font-style: italic; }
          
          .print-legal-footer { display: flex; justify-content: space-between; font-size: 8px; color: #64748b; line-height: 1.3; page-break-inside: avoid; }
          .small-text { font-size: 8px; }

          .rv-amount-box { margin: 20px 0; border: 2px solid #2563eb; padding: 15px; border-radius: 8px; }
        }
      `}</style>
    </div>
  );
}

