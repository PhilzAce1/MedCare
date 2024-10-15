"use client";

import { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import "leaflet/dist/leaflet.css";
import { Toaster } from "react-hot-toast";
import { usePathname } from "next/navigation";
import { getAvailableRewards, getUserByEmail } from "@/utils/db/actions";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    const fetchTotalEarnings = async () => {
      try {
        const userEmail = localStorage.getItem("userEmail");
        if (userEmail) {
          const user = await getUserByEmail(userEmail);

          if (user) {
            const availableRewards = (await getAvailableRewards(
              user.id
            )) as any;
            setTotalEarnings(availableRewards);
          }
        }
      } catch (error) {
        console.error("Error fetching total earnings:", error);
      }
    };

    fetchTotalEarnings();
  }, []);

  const path = usePathname();

  const isIndex = path === "/";

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* {!isIndex && ( */}
          <Header
            isIndex={isIndex}
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            totalEarnings={totalEarnings}
          />
          {/* )} */}
          <div className="flex flex-1">
            {!isIndex && <Sidebar open={sidebarOpen} />}
            <main
              className={`flex-1 p-4 lg:p-8 ml-0 ${
                !isIndex && "lg:ml-64"
              } transition-all duration-300`}
            >
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
