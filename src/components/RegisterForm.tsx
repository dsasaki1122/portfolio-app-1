"use client";

import React from "react";

type Props = { onClose?: () => void };

export default function RegisterForm({ onClose }: Props) {
  const handleSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const name = fd.get("name");
    const email = fd.get("email");
    const password = fd.get("password");
    // TODO: 実際の登録処理をここに接続
    console.log("register", { name, email, password });
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm block mb-1">お名前</label>
        <input name="name" type="text" required className="w-full px-3 py-2 border rounded" />
      </div>

      <div>
        <label className="text-sm block mb-1">メールアドレス</label>
        <input name="email" type="email" required className="w-full px-3 py-2 border rounded" />
      </div>

      <div>
        <label className="text-sm block mb-1">パスワード</label>
        <input name="password" type="password" required className="w-full px-3 py-2 border rounded" />
      </div>

      <div className="flex items-center justify-center gap-4">
        <button type="submit" className="px-4 py-2 rounded bg-black text-white">
          アカウント作成
        </button>
        <button type="button" onClick={() => onClose?.()} className="px-4 py-2 rounded border">
          戻る
        </button>
      </div>
    </form>
  );
}
