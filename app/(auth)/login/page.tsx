"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Leaf } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error("Login gagal", { description: error.message })
      setIsLoading(false)
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a3a2a] p-4">
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #c9a227 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#c9a227]/20 border border-[#c9a227]/30 mb-4">
            <Leaf className="w-8 h-8 text-[#c9a227]" />
          </div>
          <h1
            className="text-2xl font-bold text-[#f7f3ec] tracking-tight"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            Kebun Lamira
          </h1>
          <p className="text-sm text-[#f7f3ec]/50 mt-1">Dashboard Manajemen Kebun</p>
        </div>

        <Card className="border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl">
          <CardHeader className="pb-2">
            <h2 className="text-[#f7f3ec] text-lg font-semibold text-center">
              Masuk ke Dashboard
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[#f7f3ec]/70 text-sm" htmlFor="email">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  autoComplete="email"
                  className="bg-white/10 border-white/20 text-[#f7f3ec] placeholder:text-white/30 focus-visible:ring-[#c9a227]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#f7f3ec]/70 text-sm" htmlFor="password">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="bg-white/10 border-white/20 text-[#f7f3ec] placeholder:text-white/30 focus-visible:ring-[#c9a227]"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#c9a227] hover:bg-[#b8911f] text-[#1a3a2a] font-semibold mt-2"
              >
                {isLoading ? "Memuat..." : "Masuk"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[#f7f3ec]/30 text-xs mt-6">
          Central Sulawesi, Indonesia
        </p>
      </div>
    </div>
  )
}
