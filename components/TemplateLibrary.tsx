import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Plus, Mail, MessageSquare, Phone } from 'lucide-react';
import { residents, residentDetails, type RiskLevel } from './data/immuneResidents';

type TemplateLibraryProps = {
  startInEditor?: boolean;
  onEditorClose?: () => void;
  selectedResidentId?: string | null;
};

export function TemplateLibrary({
  startInEditor = false,
  onEditorClose,
  selectedResidentId
}: TemplateLibraryProps) {
  const [showEditor, setShowEditor] = useState(startInEditor);

  useEffect(() => {
    if (startInEditor) {
      setShowEditor(true);
    }
  }, [startInEditor]);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'voice': return <Phone className="w-4 h-4" />;
      default: return null;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email': return 'bg-blue-100 text-blue-700';
      case 'sms': return 'bg-green-100 text-green-700';
      case 'voice': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    onEditorClose?.();
  };

  if (showEditor) {
    return (
      <TemplateEditor
        onClose={handleCloseEditor}
        selectedResidentId={selectedResidentId}
      />
    );
  }

  const recentMessages = [
    {
      id: 'msg-1',
      resident: '김영희',
      room: '201호',
      channel: 'sms',
      summary: '건강 상태 및 체온 안내',
      staff: '이은지',
      time: '오늘 09:12',
      status: '발송 완료'
    },
    {
      id: 'msg-2',
      resident: '박철수',
      room: '201호',
      channel: 'sms',
      summary: '혈압 수치 및 주의 사항 안내',
      staff: '김현수',
      time: '오늘 08:40',
      status: '발송 완료'
    },
    {
      id: 'msg-3',
      resident: '윤미경',
      room: '203호',
      channel: 'email',
      summary: '검사 수치 요약 및 면회 안내',
      staff: '박소연',
      time: '어제 17:25',
      status: '발송 완료'
    },
    {
      id: 'msg-4',
      resident: '오춘자',
      room: '206호',
      channel: 'voice',
      summary: '투약 변경 사항 구두 안내',
      staff: '이은지',
      time: '어제 15:10',
      status: '연락 완료'
    }
  ];

  const contactHistory = [
    {
      id: 'log-1',
      resident: '김영희',
      relation: '자녀',
      channel: 'SMS',
      staff: '이은지',
      time: '2026-02-15 09:12',
      note: '체온·혈압 안내 및 면회 일정 전달'
    },
    {
      id: 'log-2',
      resident: '박철수',
      relation: '배우자',
      channel: 'SMS',
      staff: '김현수',
      time: '2026-02-15 08:40',
      note: '혈압 상승 관찰로 수치 공유'
    },
    {
      id: 'log-3',
      resident: '윤미경',
      relation: '자녀',
      channel: 'Email',
      staff: '박소연',
      time: '2026-02-14 17:25',
      note: '검사 수치 요약 및 권장 조치 안내'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1>최근 보낸 메시지 및 연락 기록</h1>
          <p className="text-muted-foreground">
            보호자에게 발송한 안내 메시지와 연락 기록을 확인합니다.
          </p>
        </div>
        <Button onClick={() => setShowEditor(true)}>
          <Plus className="w-4 h-4 mr-2" />
          메시지 작성
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">오늘 발송</div>
            <div className="text-2xl font-semibold">12건</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">연락 완료율</div>
            <div className="text-2xl font-semibold">96%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">평균 응답 시간</div>
            <div className="text-2xl font-semibold">2시간 10분</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">미확인 연락</div>
            <div className="text-2xl font-semibold">1건</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>최근 보낸 메시지</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentMessages.map((message) => (
              <div
                key={message.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      {message.resident} · {message.room}
                    </div>
                    <div className="text-xs text-muted-foreground">{message.summary}</div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`${getChannelColor(message.channel)} border-0`}
                  >
                    {getChannelIcon(message.channel)}
                    <span className="ml-1 capitalize">{message.channel}</span>
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>담당: {message.staff}</span>
                  <span>{message.time}</span>
                  <span className="text-emerald-600">{message.status}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>연락 기록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contactHistory.map((log) => (
              <div key={log.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                  <span>{log.resident}</span>
                  <span className="text-xs text-slate-500">{log.channel}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  관계: {log.relation} · 담당: {log.staff}
                </div>
                <div className="mt-2 text-xs text-slate-600">{log.note}</div>
                <div className="mt-2 text-[11px] text-slate-400">{log.time}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type TemplateEditorProps = {
  onClose: () => void;
  selectedResidentId?: string | null;
};

function TemplateEditor({ onClose, selectedResidentId }: TemplateEditorProps) {
  const [selectedChannel, setSelectedChannel] = useState('email');
  const selectedResident = useMemo(
    () =>
      (selectedResidentId
        ? residents.find((resident) => resident.id === selectedResidentId)
        : null) ?? residents[0],
    [selectedResidentId]
  );
  const details = residentDetails[selectedResident.id] ?? residentDetails['r-101'];
  const conditionLabel = details?.conditions?.length ? details.conditions.join(', ') : '기록 없음';
  const labMap = useMemo(() => {
    const map: Record<string, string> = {};
    details?.labs?.forEach((lab) => {
      map[lab.name] = lab.value;
    });
    return map;
  }, [details]);

  const riskLabelMap: Record<RiskLevel, string> = {
    critical: 'CRITICAL',
    high: 'HIGH',
    moderate: 'MODERATE',
    low: 'LOW'
  };

  const vitalsByRisk: Record<RiskLevel, { temp: string; bp: string; spo2: string }> = {
    critical: { temp: '38.2', bp: '150/92', spo2: '92' },
    high: { temp: '37.6', bp: '138/88', spo2: '94' },
    moderate: { temp: '37.0', bp: '128/82', spo2: '96' },
    low: { temp: '36.6', bp: '118/75', spo2: '98' }
  };

  const tokenValues = useMemo(
    () => ({
      'Resident Name': selectedResident.name,
      Room: selectedResident.room,
      Age: String(selectedResident.age),
      Gender: selectedResident.gender,
      'Risk Level': riskLabelMap[selectedResident.risk],
      'DIVS Score': selectedResident.score.toFixed(1),
      Conditions: conditionLabel,
      Temp: vitalsByRisk[selectedResident.risk].temp,
      BP: vitalsByRisk[selectedResident.risk].bp,
      SpO2: vitalsByRisk[selectedResident.risk].spo2,
      Albumin: labMap.Albumin ?? '-',
      Lymphocyte: labMap.Lymphocyte ?? '-',
      CRP: labMap.CRP ?? '-',
      'Total Protein': labMap['Total Protein'] ?? '-',
      'Facility Name': '해맑은 요양원',
      'Facility Phone': '02-1234-5678'
    }),
    [selectedResident, conditionLabel, labMap]
  );

  const baseTemplate = `안녕하세요. {{Resident Name}} 보호자님,

{{Facility Name}}에서 {{Resident Name}} 어르신({{Room}})의 오늘 상태를 안내드립니다.
DIVS 점수 {{DIVS Score}}점, 위험등급 {{Risk Level}}입니다.
체온 {{Temp}}℃, 혈압 {{BP}}mmHg, 산소포화도 {{SpO2}}%입니다.
주요 수치: Albumin {{Albumin}}, Lymphocyte {{Lymphocyte}}, CRP {{CRP}}.
기저질환: {{Conditions}}.

필요 시 담당 간호사에게 연락 부탁드립니다.

감사합니다.
{{Facility Name}} 드림
연락처: {{Facility Phone}}`;

  const resolveTemplate = (content: string) =>
    content.replace(/\{\{([^}]+)\}\}/g, (match, token) => {
      const value = tokenValues[token.trim()];
      return value ?? match;
    });

  const [templateContent, setTemplateContent] = useState(() => resolveTemplate(baseTemplate));

  useEffect(() => {
    setTemplateContent(resolveTemplate(baseTemplate));
  }, [selectedResidentId]);

  const channels = [
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'sms', name: 'SMS', icon: MessageSquare },
    { id: 'voice', name: 'Voice', icon: Phone }
  ];

  const tokens = [
    { token: '{{Resident Name}}', label: '이용자 이름', value: tokenValues['Resident Name'] },
    { token: '{{Room}}', label: '방 번호', value: tokenValues.Room },
    { token: '{{Age}}', label: '나이', value: tokenValues.Age },
    { token: '{{Gender}}', label: '성별', value: tokenValues.Gender },
    { token: '{{Risk Level}}', label: '위험 등급', value: tokenValues['Risk Level'] },
    { token: '{{DIVS Score}}', label: 'DIVS 점수', value: tokenValues['DIVS Score'] },
    { token: '{{Conditions}}', label: '기저질환', value: tokenValues.Conditions },
    { token: '{{Temp}}', label: '체온', value: `${tokenValues.Temp}℃` },
    { token: '{{BP}}', label: '혈압', value: tokenValues.BP },
    { token: '{{SpO2}}', label: '산소포화도', value: `${tokenValues.SpO2}%` },
    { token: '{{Albumin}}', label: 'Albumin', value: tokenValues.Albumin },
    { token: '{{Lymphocyte}}', label: 'Lymphocyte', value: tokenValues.Lymphocyte },
    { token: '{{CRP}}', label: 'CRP', value: tokenValues.CRP },
    { token: '{{Total Protein}}', label: 'Total Protein', value: tokenValues['Total Protein'] },
    { token: '{{Facility Name}}', label: '시설명', value: tokenValues['Facility Name'] },
    { token: '{{Facility Phone}}', label: '연락처', value: tokenValues['Facility Phone'] }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Template Editor</h1>
          <p className="text-muted-foreground">Create and customize your collection message templates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button>Save Template</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Main Editor */}
        <div className="space-y-6">
          {/* Insert Tokens */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Insert Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {tokens.map((token) => (
                  <Button
                    key={token.token}
                    variant="ghost"
                    size="sm"
                    className="justify-start h-auto p-2"
                    onClick={() => setTemplateContent((prev) => prev + token.token)}
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-xs font-semibold text-slate-700">{token.label}</span>
                      <span className="text-[11px] text-slate-500">{token.value}</span>
                      <span className="text-[10px] font-mono text-slate-400">{token.token}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Channel Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Channel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {channels.map((channel) => {
                  const Icon = channel.icon;
                  return (
                    <Button
                      key={channel.id}
                      variant={selectedChannel === channel.id ? 'default' : 'outline'}
                      onClick={() => setSelectedChannel(channel.id)}
                      className="flex-1"
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {channel.name}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Content Editor */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Message Content</CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                {selectedChannel === 'voice' ? (
                  <div className="flex h-full flex-col gap-4">
                    <textarea
                      className="w-full flex-1 min-h-[18rem] p-3 border rounded-md resize-none"
                      placeholder="Enter your voice script here. Use {{tokens}} for personalization."
                      value={templateContent}
                      onChange={(e) => setTemplateContent(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Phone className="w-4 h-4 mr-2" />
                        Test Playback
                      </Button>
                      <Button size="sm" variant="outline">Insert Pause</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Message Body</label>
                      <textarea
                        className="w-full flex-1 min-h-[18rem] p-3 border rounded-md resize-none"
                        placeholder="Enter your message here. Use {{tokens}} for personalization."
                        value={templateContent}
                        onChange={(e) => setTemplateContent(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                <div className="h-full rounded-lg bg-muted/50 p-4">
                  <div className="whitespace-pre-wrap text-sm">
                    {templateContent.replace(/\{\{([^}]+)\}\}/g, (match, token) => {
                      const value = tokenValues[token.trim()];
                      return value ?? `[${token}]`;
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
