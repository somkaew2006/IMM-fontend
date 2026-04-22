"use client";

import React, { useState } from "react";
import { Layout, Menu, Button, theme, ConfigProvider, Typography, Avatar, Space } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  CodeSandboxOutlined,
  FormOutlined,
  TableOutlined,
  BookOutlined,
  AuditOutlined,
  BellOutlined,
  SearchOutlined,
  CalendarOutlined,
  AccountBookOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#26a69a",
          borderRadius: 20,
          fontFamily: "var(--font-prompt), sans-serif",
          colorBgBase: "#ffffff",
          colorTextBase: "#1e293b",
        },
        components: {
          Layout: {
            siderBg: "#26a69a",
            headerBg: "#ffffff",
            bodyBg: "#f8fafc",
          },
          Menu: {
            itemBg: "transparent",
            itemSelectedBg: "#ffffff",
            itemSelectedColor: "#26a69a",
            itemActiveColor: "#ffffff",
            itemHoverBg: "rgba(255, 255, 255, 0.1)",
            itemHoverColor: "#ffffff",
            itemColor: "#ffffff",
            colorText: "#ffffff",
            itemBorderRadius: 100, // Pill shape for selected item
            subMenuItemBg: "transparent",
            popupBg: "#26a69a",
            groupTitleColor: "rgba(255, 255, 255, 0.45)",
            subMenuColor: "#ffffff",
            itemColor: "#ffffff",
          },
          Card: {
            borderRadiusLG: 24,
          },
          Button: {
            borderRadius: 12,
            controlHeight: 40,
          },
          Table: {
            borderRadius: 16,
          }
        },
      }}
    >
      <Layout style={{ minHeight: "100vh" }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={260}
          style={{
            overflow: "auto",
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 10,
            borderRight: "none",
          }}
          className="sidebar-gradient-bg"
        >
          {/* Logo Area */}
          <div className="flex items-center gap-3 px-6 h-20 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-xl">
              <CodeSandboxOutlined className="text-teal-600 text-2xl" />
            </div>
            {!collapsed && (
              <span className="text-white font-black text-xl tracking-tight uppercase antialiased">
                IMM ERP
              </span>
            )}
          </div>

          <div className="px-1">
            <Menu
              mode="inline"
              selectedKeys={[pathname]}
              items={[
                {
                  key: "/",
                  icon: <DashboardOutlined />,
                  label: <Link href="/">Dashboard</Link>,
                },
                {
                  key: "booking_menu",
                  icon: <CalendarOutlined />,
                  label: "Booking",
                  children: [
                    {
                      key: "/booking",
                      label: <Link href="/booking">Booking</Link>,
                    },
                  ]
                },
                {
                  key: "finance_menu",
                  icon: <AccountBookOutlined />,
                  label: "Finance",
                  children: [
                    {
                      key: "/quotation",
                      label: <Link href="/quotation">Quotation</Link>,
                    },
                    {
                      key: "/rv",
                      label: <Link href="/rv">Receive voucher</Link>,
                    },
                  ]
                },
                {
                  key: "/settings",
                  icon: <SettingOutlined />,
                  label: <Link href="/settings">Settings</Link>,
                },
              ]}
              style={{ borderRight: 0, background: 'transparent' }}
            />
          </div>

          
        </Sider>

        <Layout
          style={{
            marginLeft: collapsed ? 80 : 260,
            transition: "margin-left 0.2s ease-in-out",
            background: "#f8fafc",
          }}
        >
          <Header
            className="glass-header"
            style={{
              padding: "0 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              height: "72px",
              background: "rgba(255, 255, 255, 0.98)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div className="flex items-center gap-4">
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className="hover:bg-teal-50 text-teal-600"
                style={{
                  fontSize: "18px",
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                }}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button type="text" icon={<BellOutlined />} className="text-slate-400 hover:text-teal-500" />
              <div className="h-8 w-px bg-slate-200 mx-2"></div>
              <Space size={12} className="cursor-pointer hover:bg-slate-50 p-1 rounded-2xl transition-all">
                 <div className="text-right hidden sm:block">
                    <Text strong className="block text-xs text-slate-800">Admin Account</Text>
                    <Text className="block text-[10px] text-slate-400">System Operator</Text>
                 </div>
                 <Avatar 
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" 
                    className="bg-teal-100 border-2 border-teal-50"
                    size={40}
                 />
              </Space>
            </div>
          </Header>

          <Content
            style={{
              padding: "24px 32px",
              minHeight: 280,
              overflow: "initial",
            }}
          >
            <div className="animate-fade-in">
              {children}
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
