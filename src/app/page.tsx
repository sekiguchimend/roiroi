"use client"; 
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 最新のGemini料金設定（1000トークンあたり）
const GEMINI_PRICING = {
  "gemini-2.0-flash": {
    inputTokenRate: 0.00010,   // $0.10 per 1M → $0.00010 per 1K
    outputTokenRate: 0.00040,  // $0.40 per 1M → $0.00040 per 1K
    name: "Gemini 2.0 Flash"
  },
  "gemini-2.0-flash-lite": {
    inputTokenRate: 0.000075,  // $0.075 per 1M → $0.000075 per 1K
    outputTokenRate: 0.00030,  // $0.30 per 1M → $0.00030 per 1K
    name: "Gemini 2.0 Flash-Lite"
  },
  "gemini-1.5-flash": {
    inputTokenRate: 0.000075,  // $0.075 per 1M → $0.000075 per 1K
    outputTokenRate: 0.00030,  // $0.30 per 1M → $0.00030 per 1K
    name: "Gemini 1.5 Flash"
  }
};

// selectedModelがGEMINI_PRICINGのキーとして有効であることを明示する型定義
type GeminiModel = keyof typeof GEMINI_PRICING;

// 入力パラメータのデフォルト値
const DEFAULT_VALUES = {
  // 社内質疑応答のデフォルト
  internal: {
    promptTokens: 2000,
    outputTokens: 2000,
    chatsPerUserPerDay: 10,
    numberOfUsers: 1000
  },
  // 顧客お問い合わせ対応のデフォルト
  customer: {
    promptTokens: 1500,
    outputTokens: 3000,
    inquiriesPerDay: 500,
    responseRate: 0.8 // 応答率 80%
  }
};

// 日本語のトークン換算率（固定値）
const JA_TOKEN_RATIO = 1.5; // 1トークン≒1.5文字

export default function GeminiCostCalculator() {
  // タブ状態
  const [activeTab, setActiveTab] = useState("internal");

  // 社内質疑応答のための状態
  const [internalPromptTokens, setInternalPromptTokens] = useState<number | null>(null);
  const [internalOutputTokens, setInternalOutputTokens] = useState<number | null>(null);
  const [chatsPerUserPerDay, setChatsPerUserPerDay] = useState<number | null>(null);
  const [numberOfUsers, setNumberOfUsers] = useState<number | null>(null);

  // 顧客お問い合わせ対応のための状態
  const [customerPromptTokens, setCustomerPromptTokens] = useState<number | null>(null);
  const [customerOutputTokens, setCustomerOutputTokens] = useState<number | null>(null);
  const [inquiriesPerDay, setInquiriesPerDay] = useState<number | null>(null);
  const [responseRate, setResponseRate] = useState<number | null>(null);
  
  // 共通の状態
  const [selectedModel, setSelectedModel] = useState<GeminiModel>("gemini-2.0-flash");

  // 計算結果の状態
  const [internalResults, setInternalResults] = useState({
    monthlyInputTokens: 0,
    monthlyOutputTokens: 0,
    monthlyCost: 0,
    jpyMonthlyCost: 0
  });

  const [customerResults, setCustomerResults] = useState({
    monthlyInputTokens: 0,
    monthlyOutputTokens: 0,
    monthlyCost: 0,
    jpyMonthlyCost: 0
  });

  // 社内質疑応答コスト計算
  useEffect(() => {
    const modelPricing = GEMINI_PRICING[selectedModel];

    // 実際の値またはデフォルト値を使用
    const actualPromptTokens = internalPromptTokens ?? DEFAULT_VALUES.internal.promptTokens;
    const actualOutputTokens = internalOutputTokens ?? DEFAULT_VALUES.internal.outputTokens;
    const actualChatsPerUserPerDay = chatsPerUserPerDay ?? DEFAULT_VALUES.internal.chatsPerUserPerDay;
    const actualNumberOfUsers = numberOfUsers ?? DEFAULT_VALUES.internal.numberOfUsers;

    // 文字数からトークン数への変換（日本語の場合、1トークン≒1.5文字）
    const promptTokensPerChat = Math.round(actualPromptTokens / JA_TOKEN_RATIO);
    const outputTokensPerChat = Math.round(actualOutputTokens / JA_TOKEN_RATIO);
    
    // 1日あたりの総チャット数
    const totalChatsPerDay = actualChatsPerUserPerDay * actualNumberOfUsers;
    
    // 月間トークン計算
    const monthlyInputTokens = promptTokensPerChat * totalChatsPerDay * 30;
    const monthlyOutputTokens = outputTokensPerChat * totalChatsPerDay * 30;

    const monthlyInputCost = monthlyInputTokens / 1000 * modelPricing.inputTokenRate;
    const monthlyOutputCost = monthlyOutputTokens / 1000 * modelPricing.outputTokenRate;
    const totalMonthlyCost = monthlyInputCost + monthlyOutputCost;
    
    // JPYに変換（概算レート: 1USD = 150JPY）
    const jpyCost = totalMonthlyCost * 150;

    setInternalResults({
      monthlyInputTokens,
      monthlyOutputTokens,
      monthlyCost: totalMonthlyCost,
      jpyMonthlyCost: jpyCost
    });
  }, [internalPromptTokens, internalOutputTokens, chatsPerUserPerDay, numberOfUsers, selectedModel]);

  // 顧客お問い合わせ対応コスト計算
  useEffect(() => {
    const modelPricing = GEMINI_PRICING[selectedModel];

    // 実際の値またはデフォルト値を使用
    const actualPromptTokens = customerPromptTokens ?? DEFAULT_VALUES.customer.promptTokens;
    const actualOutputTokens = customerOutputTokens ?? DEFAULT_VALUES.customer.outputTokens;
    const actualInquiriesPerDay = inquiriesPerDay ?? DEFAULT_VALUES.customer.inquiriesPerDay;
    const actualResponseRate = responseRate ?? DEFAULT_VALUES.customer.responseRate;

    // 文字数からトークン数への変換（日本語の場合、1トークン≒1.5文字）
    const promptTokensPerInquiry = Math.round(actualPromptTokens / JA_TOKEN_RATIO);
    const outputTokensPerInquiry = Math.round(actualOutputTokens / JA_TOKEN_RATIO);
    
    // 問い合わせ処理数（日次の問い合わせ数 × 対応率）
    const dailyProcessedInquiries = actualInquiriesPerDay * actualResponseRate;
    
    // 月間トークン計算
    const monthlyInputTokens = promptTokensPerInquiry * dailyProcessedInquiries * 30;
    const monthlyOutputTokens = outputTokensPerInquiry * dailyProcessedInquiries * 30;

    const monthlyInputCost = monthlyInputTokens / 1000 * modelPricing.inputTokenRate;
    const monthlyOutputCost = monthlyOutputTokens / 1000 * modelPricing.outputTokenRate;
    const totalMonthlyCost = monthlyInputCost + monthlyOutputCost;
    
    // JPYに変換（概算レート: 1USD = 150JPY）
    const jpyCost = totalMonthlyCost * 150;

    setCustomerResults({
      monthlyInputTokens,
      monthlyOutputTokens,
      monthlyCost: totalMonthlyCost,
      jpyMonthlyCost: jpyCost
    });
  }, [customerPromptTokens, customerOutputTokens, inquiriesPerDay, responseRate, selectedModel]);

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-center">Geminiチャット利用コスト計算ツール</h1>
      
      <div>
        <label className="block text-sm font-medium mb-1">Geminiモデル選択</label>
        <select 
          value={selectedModel} 
          onChange={(e) => setSelectedModel(e.target.value as GeminiModel)}
          className="w-full p-2 border rounded mb-4"
        >
          {Object.entries(GEMINI_PRICING).map(([key, model]) => (
            <option key={key} value={key}>{model.name}</option>
          ))}
        </select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="internal">社内質疑応答</TabsTrigger>
          <TabsTrigger value="customer">顧客お問い合わせ対応</TabsTrigger>
        </TabsList>
        
        {/* 社内質疑応答のタブコンテンツ */}
        <TabsContent value="internal">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>社内質疑応答パラメータ</CardTitle>
                <CardDescription>社内での利用想定を入力してください</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[ 
                  { 
                    label: "1回のプロンプト文字数", 
                    value: internalPromptTokens, 
                    setter: setInternalPromptTokens, 
                    placeholder: DEFAULT_VALUES.internal.promptTokens 
                  },
                  { 
                    label: "1回の出力文字数", 
                    value: internalOutputTokens, 
                    setter: setInternalOutputTokens, 
                    placeholder: DEFAULT_VALUES.internal.outputTokens 
                  },
                  { 
                    label: "1人1日あたりのチャット回数", 
                    value: chatsPerUserPerDay, 
                    setter: setChatsPerUserPerDay, 
                    placeholder: DEFAULT_VALUES.internal.chatsPerUserPerDay 
                  },
                  { 
                    label: "利用者数", 
                    value: numberOfUsers, 
                    setter: setNumberOfUsers, 
                    placeholder: DEFAULT_VALUES.internal.numberOfUsers 
                  }
                ].map(({ label, value, setter, placeholder }, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium mb-1">{label}</label>
                    <input 
                      type="text" 
                      value={value === null ? '' : value} 
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        if (inputValue === '') {
                          setter(null);
                        } else {
                          const newValue = Number(inputValue);
                          if (!isNaN(newValue)) {
                            setter(newValue);
                          }
                        }
                      }}
                      placeholder={placeholder.toString()}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>月間コスト分析結果</CardTitle>
                <CardDescription>社内利用の推定月間コスト</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[ 
                  { label: "月間入力トークン数", value: internalResults.monthlyInputTokens },
                  { label: "月間出力トークン数", value: internalResults.monthlyOutputTokens },
                  { label: "月間推定コスト ($)", value: `$${internalResults.monthlyCost.toFixed(2)}` },
                  { label: "月間推定コスト (円)", value: `¥${Math.round(internalResults.jpyMonthlyCost).toLocaleString()}` }
                ].map(({ label, value }, index) => (
                  <div key={index} className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">{label}</p>
                    <p className="text-2xl font-bold">
                      {typeof value === 'string' ? value : value.toLocaleString()}
                    </p>
                  </div>
                ))}

                <div className="text-sm text-gray-600 mt-4">
                  <p>※日本語テキストは1トークン≒1.5文字で換算</p>
                  <p>※チャット履歴の蓄積による追加トークン消費は含まれていません</p>
                  <p>※米ドル→日本円は1ドル=150円で概算</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* 顧客お問い合わせ対応のタブコンテンツ */}
        <TabsContent value="customer">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>顧客お問い合わせ対応パラメータ</CardTitle>
                <CardDescription>顧客対応での利用想定を入力してください</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[ 
                  { 
                    label: "問い合わせ1件あたりのプロンプト文字数", 
                    value: customerPromptTokens, 
                    setter: setCustomerPromptTokens, 
                    placeholder: DEFAULT_VALUES.customer.promptTokens 
                  },
                  { 
                    label: "問い合わせ1件あたりの回答文字数", 
                    value: customerOutputTokens, 
                    setter: setCustomerOutputTokens, 
                    placeholder: DEFAULT_VALUES.customer.outputTokens 
                  },
                  { 
                    label: "1日あたりの問い合わせ数", 
                    value: inquiriesPerDay, 
                    setter: setInquiriesPerDay, 
                    placeholder: DEFAULT_VALUES.customer.inquiriesPerDay 
                  },
                  { 
                    label: "AI対応率 (0～1.0)", 
                    value: responseRate, 
                    setter: setResponseRate, 
                    placeholder: DEFAULT_VALUES.customer.responseRate 
                  }
                ].map(({ label, value, setter, placeholder }, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium mb-1">{label}</label>
                    <input 
                      type="text" 
                      value={value === null ? '' : value} 
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        if (inputValue === '') {
                          setter(null);
                        } else {
                          const newValue = Number(inputValue);
                          if (!isNaN(newValue)) {
                            setter(newValue);
                          }
                        }
                      }}
                      placeholder={placeholder.toString()}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>月間コスト分析結果</CardTitle>
                <CardDescription>顧客対応の推定月間コスト</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[ 
                  { label: "月間入力トークン数", value: customerResults.monthlyInputTokens },
                  { label: "月間出力トークン数", value: customerResults.monthlyOutputTokens },
                  { label: "月間推定コスト ($)", value: `$${customerResults.monthlyCost.toFixed(2)}` },
                  { label: "月間推定コスト (円)", value: `¥${Math.round(customerResults.jpyMonthlyCost).toLocaleString()}` }
                ].map(({ label, value }, index) => (
                  <div key={index} className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">{label}</p>
                    <p className="text-2xl font-bold">
                      {typeof value === 'string' ? value : value.toLocaleString()}
                    </p>
                  </div>
                ))}

                <div className="text-sm text-gray-600 mt-4">
                  <p>※日本語テキストは1トークン≒1.5文字で換算</p>
                  <p>※米ドル→日本円は1ドル=150円で概算</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}