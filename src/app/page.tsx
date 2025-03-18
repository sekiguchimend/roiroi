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

export default function GeminiCostCalculator() {
  const [promptTokens, setPromptTokens] = useState(500);
  const [outputTokens, setOutputTokens] = useState(500);
  const [chatsPerUserPerDay, setChatsPerUserPerDay] = useState(10);
  const [numberOfUsers, setNumberOfUsers] = useState(1000);
  const [selectedModel, setSelectedModel] = useState<GeminiModel>("gemini-2.0-flash");

  const [monthlyInputTokens, setMonthlyInputTokens] = useState(0);
  const [monthlyOutputTokens, setMonthlyOutputTokens] = useState(0);
  const [monthlyCost, setMonthlyCost] = useState(0);

  useEffect(() => {
    const modelPricing = GEMINI_PRICING[selectedModel];

    const promptTokensPerChat = Math.round(promptTokens / 4);
    const outputTokensPerChat = Math.round(outputTokens / 4);

    const monthlyInputTokensCalc = promptTokensPerChat * chatsPerUserPerDay * numberOfUsers * 30;
    const monthlyOutputTokensCalc = outputTokensPerChat * chatsPerUserPerDay * numberOfUsers * 30;

    const monthlyInputCost = monthlyInputTokensCalc / 1000 * modelPricing.inputTokenRate;
    const monthlyOutputCost = monthlyOutputTokensCalc / 1000 * modelPricing.outputTokenRate;
    const totalMonthlyCost = monthlyInputCost + monthlyOutputCost;

    setMonthlyInputTokens(monthlyInputTokensCalc);
    setMonthlyOutputTokens(monthlyOutputTokensCalc);
    setMonthlyCost(totalMonthlyCost);
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
              { label: "1回のプロンプト文字数", value: promptTokens, setter: setPromptTokens },
              { label: "1回の出力文字数", value: outputTokens, setter: setOutputTokens },
              { label: "1人1日あたりのチャット回数", value: chatsPerUserPerDay, setter: setChatsPerUserPerDay },
              { label: "利用者数", value: numberOfUsers, setter: setNumberOfUsers }
            ].map(({ label, value, setter }, index) => (
              <div key={index}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <input 
                  type="text" 
                  value={value} 
                  onChange={(e) => {
                    // 空文字列の場合は0、それ以外は数値に変換
                    const newValue = e.target.value === '' ? 0 : Number(e.target.value);
                    // 数値として有効な場合のみ更新
                    if (!isNaN(newValue)) {
                      setter(newValue);
                    }
                  }}
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
              { label: "月間推定コスト ($)", value: `$${monthlyCost.toFixed(2)}` }
            ].map(({ label, value }, index) => (
              <div key={index} className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-600">{label}</p>
                <p className="text-2xl font-bold">{value.toLocaleString()}</p>
              </div>
            ))}

            <div className="text-sm text-gray-600 mt-4">
              <p>※1トークン≒4文字で換算</p>
              <p>※最新のGemini料金に基づいて計算</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}