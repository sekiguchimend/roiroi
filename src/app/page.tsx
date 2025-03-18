"use client"; 
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

// 入力パラメータのデフォルト値（より現実的な設定）
const DEFAULT_VALUES = {
  promptTokens: 2000,
  outputTokens: 2000,
  chatsPerUserPerDay: 10,
  numberOfUsers: 1000
};

// 日本語のトークン換算率（固定値）
const JA_TOKEN_RATIO = 1.5; // 1トークン≒1.5文字

export default function GeminiCostCalculator() {
  // 入力値は初期値をnullにして、プレースホルダーとして表示できるようにする
  const [promptTokens, setPromptTokens] = useState<number | null>(null);
  const [outputTokens, setOutputTokens] = useState<number | null>(null);
  const [chatsPerUserPerDay, setChatsPerUserPerDay] = useState<number | null>(null);
  const [numberOfUsers, setNumberOfUsers] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<GeminiModel>("gemini-2.0-flash");

  const [monthlyInputTokens, setMonthlyInputTokens] = useState(0);
  const [monthlyOutputTokens, setMonthlyOutputTokens] = useState(0);
  const [monthlyCost, setMonthlyCost] = useState(0);
  const [jpyMonthlyCost, setJpyMonthlyCost] = useState(0);

  useEffect(() => {
    const modelPricing = GEMINI_PRICING[selectedModel];

    // 実際の値またはデフォルト値を使用
    const actualPromptTokens = promptTokens ?? DEFAULT_VALUES.promptTokens;
    const actualOutputTokens = outputTokens ?? DEFAULT_VALUES.outputTokens;
    const actualChatsPerUserPerDay = chatsPerUserPerDay ?? DEFAULT_VALUES.chatsPerUserPerDay;
    const actualNumberOfUsers = numberOfUsers ?? DEFAULT_VALUES.numberOfUsers;

    // 文字数からトークン数への変換（日本語の場合、1トークン≒1.5文字）
    const promptTokensPerChat = Math.round(actualPromptTokens / JA_TOKEN_RATIO);
    const outputTokensPerChat = Math.round(actualOutputTokens / JA_TOKEN_RATIO);

    const monthlyInputTokensCalc = promptTokensPerChat * actualChatsPerUserPerDay * actualNumberOfUsers * 30;
    const monthlyOutputTokensCalc = outputTokensPerChat * actualChatsPerUserPerDay * actualNumberOfUsers * 30;

    const monthlyInputCost = monthlyInputTokensCalc / 1000 * modelPricing.inputTokenRate;
    const monthlyOutputCost = monthlyOutputTokensCalc / 1000 * modelPricing.outputTokenRate;
    const totalMonthlyCost = monthlyInputCost + monthlyOutputCost;
    
    // JPYに変換（概算レート: 1USD = 150JPY）
    const jpyCost = totalMonthlyCost * 150;

    setMonthlyInputTokens(monthlyInputTokensCalc);
    setMonthlyOutputTokens(monthlyOutputTokensCalc);
    setMonthlyCost(totalMonthlyCost);
    setJpyMonthlyCost(jpyCost);
  }, [promptTokens, outputTokens, chatsPerUserPerDay, numberOfUsers, selectedModel]);

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-center">Geminiチャット利用コスト計算ツール</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>チャット利用パラメータ</CardTitle>
            <CardDescription>チャットの利用想定を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Geminiモデル選択</label>
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value as GeminiModel)}
                className="w-full p-2 border rounded"
              >
                {Object.entries(GEMINI_PRICING).map(([key, model]) => (
                  <option key={key} value={key}>{model.name}</option>
                ))}
              </select>
            </div>

            {[ 
              { 
                label: "1回のプロンプト文字数", 
                value: promptTokens, 
                setter: setPromptTokens, 
                placeholder: DEFAULT_VALUES.promptTokens 
              },
              { 
                label: "1回の出力文字数", 
                value: outputTokens, 
                setter: setOutputTokens, 
                placeholder: DEFAULT_VALUES.outputTokens 
              },
              { 
                label: "1人1日あたりのチャット回数", 
                value: chatsPerUserPerDay, 
                setter: setChatsPerUserPerDay, 
                placeholder: DEFAULT_VALUES.chatsPerUserPerDay 
              },
              { 
                label: "利用者数", 
                value: numberOfUsers, 
                setter: setNumberOfUsers, 
                placeholder: DEFAULT_VALUES.numberOfUsers 
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
                      // 空の場合はnullにする（プレースホルダーを表示）
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
            <CardDescription>推定される月間利用コスト</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[ 
              { label: "月間入力トークン数", value: monthlyInputTokens },
              { label: "月間出力トークン数", value: monthlyOutputTokens },
              { label: "月間推定コスト ($)", value: `$${monthlyCost.toFixed(2)}` },
              { label: "月間推定コスト (円)", value: `¥${Math.round(jpyMonthlyCost).toLocaleString()}` }
            ].map(({ label, value }, index) => (
              <div key={index} className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-600">{label}</p>
                <p className="text-2xl font-bold">{value.toLocaleString()}</p>
              </div>
            ))}

            <div className="text-sm text-gray-600 mt-4">
              <p>※日本語テキストは1トークン≒1.5文字で換算</p>
              <p>※チャット履歴の蓄積による追加トークン消費は含まれていません</p>
              <p>※米ドル→日本円は1ドル=150円で概算</p>
              <p>※最新のGemini料金に基づいて計算</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}