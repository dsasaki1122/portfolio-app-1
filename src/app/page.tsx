"use client";

import React, { useState } from "react";
import Modal from "../components/Modal";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="min-h-screen w-full relative">
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: "url('/picture_1.png')" }}
        aria-hidden
      />

      <div className="absolute inset-0 bg-black/40" />

      <main className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="max-w-4xl w-full px-6 py-28 text-center">
          <h1 className="text-5xl font-bold text-black mb-6">探してMeal</h1>

          <p className="text-white/90 mb-8">まずはログイン、またはアカウントを作成してください。</p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setShowLogin(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded bg-black/90 text-white hover:opacity-90"
            >
              メールアドレスでログイン
            </button>

            <button
              onClick={() => setShowRegister(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded border border-white/30 text-white bg-white/10 hover:bg-white/20"
            >
              アカウント作成
            </button>
          </div>
        </div>
      </main>

      {showLogin && (
        <Modal title="ログイン" onClose={() => setShowLogin(false)}>
          <LoginForm onClose={() => setShowLogin(false)} />
        </Modal>
      )}

      {showRegister && (
        <Modal title="アカウント作成" onClose={() => setShowRegister(false)}>
          <RegisterForm onClose={() => setShowRegister(false)} />
        </Modal>
      )}
    </div>
  );
}
