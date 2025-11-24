"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";
import apiClient from "../lib/apiClient";

const SignalRContext = createContext<HubConnection | null>(null);

export const SignalRProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [connection, setConnection] = useState<HubConnection | null>(null);

  // 🔹 Khởi tạo kết nối
  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    console.log("🎫 SignalR using token:", token ? "✅ FOUND" : "❌ NOT FOUND");

    if (!token) {
      console.warn("⚠️ No token found. SignalR not initialized.");
      return;
    }

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${apiClient.defaults.baseURL}/notificationHub`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    // 🧹 cleanup khi unmount
    return () => {
      newConnection.stop();
    };
  }, []);

  // 🔹 Start connection + JoinGroup + Listen event
  useEffect(() => {
    if (!connection) return;

    const startConnection = async () => {
      try {
        if (connection.state === HubConnectionState.Disconnected) {
          await connection.start();
          console.log("✅ SignalR Connected!");
        }

        // 🕐 Chờ cho đến khi connection thật sự connected
        const waitUntilConnected = async () => {
          let retries = 0;
          while (
            connection.state !== HubConnectionState.Connected &&
            retries < 10
          ) {
            await new Promise((r) => setTimeout(r, 500));
            retries++;
          }
        };
        await waitUntilConnected();

        // ✅ Sau khi connected thì mới JoinGroup
        const userId = localStorage.getItem("userId");
        if (connection.state === HubConnectionState.Connected && userId) {
          try {
            await connection.invoke("JoinGroup", `user_${userId}`);
            console.log("👥 Joined group:", `user_${userId}`);
          } catch (err) {
            console.error("⚠️ JoinGroup failed:", err);
          }
        }

        // 🔔 Nhận event từ BE
        connection.on("NewTaskAssigned", (payload) => {
          console.log("📨 Received from SignalR:", payload);
          if (!payload) return;
          const event = new CustomEvent("taskAssigned", { detail: payload });
          window.dispatchEvent(event);
        });

        connection.onclose((err) =>
          console.error("🔴 Connection closed:", err)
        );
        connection.onreconnecting(() => console.warn("🟡 Reconnecting..."));
        connection.onreconnected(() => console.log("🟢 Reconnected!"));
      } catch (err) {
        console.error("❌ SignalR start failed:", err);
        setTimeout(startConnection, 3000); // 🔁 Thử lại sau 3s
      }
    };

    startConnection();

    return () => {
      connection.off("NewTaskAssigned");
      connection.stop();
    };
  }, [connection]);

  return (
    <SignalRContext.Provider value={connection}>
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalR = () => useContext(SignalRContext);
