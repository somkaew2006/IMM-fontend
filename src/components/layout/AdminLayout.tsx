"use client";

import React, { useState } from "react";
import { Layout, Menu, Button, theme, ConfigProvider, Typography, Avatar } from "antd";
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
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const pathname = usePathname();

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677ff", // Classic Admin Blue
          borderRadius: 4,
          fontFamily: "var(--font-prompt), sans-serif",
        },
        components: {
          Layout: {
            siderBg: "#343a40", // AdminLTE dark sidebar
            headerBg: "#ffffff",
          },
          Menu: {
            darkItemBg: "#343a40",
            darkSubMenuItemBg: "#2c3136",
            darkItemSelectedBg: "#007bff",
            darkItemColor: "#c2c7d0",
            darkItemHoverColor: "#ffffff",
            darkItemSelectedColor: "#ffffff",
          },
        },
      }}
    >
      <Layout style={{ minHeight: "100vh" }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={250}
          style={{
            overflow: "auto",
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
          }}
        >
          {/* Logo Area */}
          <div className="flex items-center justify-center h-16 bg-[#343a40] border-b border-[#4b545c]">
             {collapsed ? (
                <CodeSandboxOutlined className="text-white text-2xl" />
             ) : (
                <div className="flex items-center gap-2 px-4 w-full">
                  <CodeSandboxOutlined className="text-white text-2xl" />
                  <span className="text-white font-bold text-lg whitespace-nowrap overflow-hidden text-ellipsis">
                    ERP Admin
                  </span>
                </div>
             )}
          </div>

          {/* User Panel (Optional AdminLTE style) */}
          {!collapsed && (
            <div className="flex items-center gap-3 p-4 border-b border-[#4b545c]">
              <Avatar icon={<UserOutlined />} className="bg-slate-500" />
              <div className="flex flex-col overflow-hidden text-ellipsis">
                <span className="text-[#c2c7d0] font-medium text-sm">Admin User</span>
                <span className="text-[#869099] text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Online
                </span>
              </div>
            </div>
          )}

          <div className="py-2">
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[pathname]}
              items={[
                {
                  key: "/",
                  icon: <DashboardOutlined />,
                  label: <Link href="/">Dashboard</Link>,
                },
                {
                  key: "/forms",
                  icon: <FormOutlined />,
                  label: <Link href="/forms">Sample Forms</Link>,
                },
                {
                  key: "/tables",
                  icon: <TableOutlined />,
                  label: <Link href="/tables">Sample Tables</Link>,
                },
                {
                  key: "booking_menu",
                  icon: <BookOutlined />,
                  label: "Booking",
                  children: [
                    {
                      key: "/booking",
                      label: <Link href="/booking">Booking</Link>,
                    },
                  ],
                },
                {
                  key: "sub1",
                  icon: <SettingOutlined />,
                  label: "Settings",
                  children: [
                    {
                      key: "/settings/users",
                      label: <Link href="/settings/users">Users</Link>,
                    },
                  ],
                },
              ]}
            />
          </div>
        </Sider>

        <Layout
          style={{
            marginLeft: collapsed ? 80 : 250,
            transition: "margin-left 0.2s cubic-bezier(0.645, 0.045, 0.355, 1)",
          }}
        >
          <Header
            style={{
              padding: "0 16px",
              background: colorBgContainer,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 1px 4px rgba(0,21,41,0.08)",
              position: "sticky",
              top: 0,
              zIndex: 1,
              width: "100%",
              height: "60px",
              lineHeight: "60px",
            }}
          >
            <div className="flex items-center">
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: "16px",
                  width: 64,
                  height: 60,
                  borderRadius: 0,
                  border: 0,
                }}
              />
            </div>
            <div className="flex items-center pe-4">
               {/* Top Right Header tools */}
               <Button type="text" icon={<UserOutlined />} />
            </div>
          </Header>
          
          <Content
            style={{
              margin: "24px 16px",
              padding: 24,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              overflow: "initial",
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
