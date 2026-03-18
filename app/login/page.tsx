"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && password !== confirmPassword) {
      toast.error("パスワードが一致しません");
      return;
    }
    if (!email.trim() || !password) {
      toast.error("メールアドレスとパスワードを入力してください");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          toast.error("ログインに失敗しました", {
            description: error.message,
          });
          return;
        }
        toast.success("ログインしました");
        router.push(next);
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) {
          toast.error("会員登録に失敗しました", {
            description: error.message,
          });
          return;
        }
        toast.success("確認メールを送信しました", {
          description: "メール内のリンクから認証を完了してください。",
        });
        setPassword("");
        setConfirmPassword("");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px] space-y-8">
        {/* ロゴ */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <img
              src="/listicon.png"
              alt="リストール"
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="text-2xl font-bold text-foreground">リストール</span>
          </div>
          <p className="text-sm text-muted-foreground">
            営業リスト自動生成SaaS
          </p>
        </div>

        <Card className="border-border">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  mode === "login"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ログイン
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  mode === "signup"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                会員登録
              </button>
            </div>
            <CardTitle className="text-center text-lg">
              {mode === "login" ? "アカウントにログイン" : "新規アカウント作成"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="h-10"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="h-10"
                  disabled={loading}
                />
              </div>
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">パスワード（確認）</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="h-10"
                    disabled={loading}
                  />
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-10"
                disabled={loading}
              >
                {loading
                  ? "処理中..."
                  : mode === "login"
                    ? "ログイン"
                    : "会員登録"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
