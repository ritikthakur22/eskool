import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../core/networking/api';
import { useTheme } from '../../../core/theme/ThemeContext';
import BottomNavigation from '../../../core/components/BottomNavigation';

type Invoice = {
  id: string;
  invoiceNumber: string;
  title: string;
  description?: string | null;
  amount: number;
  dueDate: string;
  status: 'DUE' | 'OVERDUE' | 'PAID';
  issuedAt: string;
  paidAt?: string | null;
  latestProofStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
};
type PaymentDetails = { bankName: string; accountName: string; accountNumber: string; qrCodeUrl?: string | null; isDemo?: boolean };
type PaymentMethod = 'WALLET' | 'BANK_TRANSFER';
type PickedFile = { uri: string; name: string; size: number; mimeType: string };

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/avif', 'image/bmp']);
const demoPaymentDetails: PaymentDetails = {
  bankName: 'Global IME Bank',
  accountName: 'eSkool Pvt. Ltd.',
  accountNumber: '000000000000',
  isDemo: true,
};
const money = (amount: number) => `NPR ${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (value: string) => new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export default function FeesScreen({ navigation }: any) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentDetails, setPaymentDetails] = useState(demoPaymentDetails);
  const [page, setPage] = useState<'STATEMENT' | 'INVOICES'>('STATEMENT');
  const [filter, setFilter] = useState<'ALL' | 'DUE' | 'PAID'>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('WALLET');
  const [transactionId, setTransactionId] = useState('');
  const [amount, setAmount] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const response = await api.get('/fees/me');
      setInvoices(Array.isArray(response.data) ? response.data : []);
      try {
        const details = await api.get('/fees/payment-details');
        setPaymentDetails({ ...demoPaymentDetails, ...details.data });
      } catch {
        setPaymentDetails(demoPaymentDetails);
      }
    } catch (e: any) {
      setError(e.response?.status === 401 ? 'Your session expired. Please sign in again.' : 'We couldn’t load your fee statement. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const due = useMemo(() => invoices.filter(item => item.status !== 'PAID'), [invoices]);
  const paid = useMemo(() => invoices.filter(item => item.status === 'PAID'), [invoices]);
  const visibleInvoices = filter === 'ALL' ? invoices : filter === 'DUE' ? due : paid;
  const totalDue = due.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const totalPaid = paid.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const selectedInvoice = invoices.find(item => item.id === expandedInvoiceId) || null;

  const getStatus = (invoice: Invoice) => {
    if (invoice.status === 'PAID') return { label: 'Paid', color: colors.success, background: colors.success + '18' };
    if (invoice.latestProofStatus === 'PENDING') return { label: 'Proof pending', color: colors.primary, background: colors.primary + '16' };
    if (invoice.latestProofStatus === 'REJECTED') return { label: 'Proof rejected', color: colors.danger, background: colors.danger + '16' };
    const overdue = new Date(invoice.dueDate).getTime() < Date.now();
    return overdue
      ? { label: 'Overdue', color: colors.danger, background: colors.danger + '16' }
      : { label: 'Due', color: colors.warning, background: colors.warning + '1A' };
  };

  const openPayment = (invoice: Invoice) => {
    if (invoice.status === 'PAID' || invoice.latestProofStatus === 'PENDING') return;
    if (expandedInvoiceId === invoice.id) {
      setExpandedInvoiceId(null);
      return;
    }
    setExpandedInvoiceId(invoice.id);
    setAmount(String(invoice.amount));
    setFiles([]);
  };

  const copyValue = async (label: string, value: string) => {
    try {
      const Clipboard = await import('expo-clipboard');
      await Clipboard.setStringAsync(value);
      Alert.alert('Copied', `${label} copied to clipboard.`);
    } catch {
      Alert.alert('Could not copy', 'Please select and copy the text manually.');
    }
  };

  const chooseProof = async () => {
    try {
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true, multiple: true });
      if (result.canceled) return;
      const picked = result.assets.map(asset => ({
        uri: asset.uri,
        name: asset.name || 'payment-proof',
        size: asset.size || 0,
        mimeType: asset.mimeType || (asset.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      }));
      if (!picked.length || picked.length > 2) {
        Alert.alert('Choose fewer files', 'Attach one PDF or up to two photos.');
        return;
      }
      const hasPdf = picked.some(file => file.mimeType === 'application/pdf');
      if ((hasPdf && picked.length !== 1) || picked.some(file => file.mimeType !== 'application/pdf' && !imageTypes.has(file.mimeType))) {
        Alert.alert('Unsupported files', 'Choose one PDF or up to two JPG, PNG, WEBP, HEIC, GIF, AVIF, or BMP images.');
        return;
      }
      const size = picked.reduce((sum, file) => sum + file.size, 0);
      if (size > MAX_UPLOAD_SIZE) {
        Alert.alert('Files are too large', 'The combined file size must be 5 MB or less.');
        return;
      }
      setFiles(picked);
    } catch {
      Alert.alert('Update the app build', 'This installed app does not include the document picker. Install a fresh development build, then try again.');
    }
  };

  const submitProof = async () => {
    if (!selectedInvoice) return;
    if (!mobileNumber.trim()) {
      Alert.alert('Mobile number required', 'Enter the mobile number used to make the payment.');
      return;
    }
    if (!transactionId.trim()) {
      Alert.alert('Transaction ID required', 'Enter the transaction reference from your wallet or bank transfer.');
      return;
    }
    if (!amount || Number(amount) <= 0 || Number(amount) > Number(selectedInvoice.amount)) {
      Alert.alert('Check the amount', `Enter a payment amount greater than zero and no more than ${money(selectedInvoice.amount)}.`);
      return;
    }
    if (!files.length) {
      Alert.alert('Payment proof required', 'Attach one PDF or up to two payment screenshots.');
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('mobileNumber', mobileNumber.trim());
      form.append('method', method);
      form.append('transactionId', transactionId.trim());
      form.append('amount', amount.trim());
      files.forEach(file => form.append('files', { uri: file.uri, name: file.name, type: file.mimeType } as any));
      await api.post(`/fees/${selectedInvoice.id}/payment-proofs`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setExpandedInvoiceId(null);
      setTransactionId('');
      setFiles([]);
      await load(true);
      Alert.alert('Proof submitted', 'Your payment is pending verification by the school office.');
    } catch (e: any) {
      const message = Array.isArray(e.response?.data?.message) ? e.response.data.message.join('\n') : e.response?.data?.message;
      Alert.alert('Could not submit proof', message || 'Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const proofPanel = selectedInvoice ? <View style={s.paymentPanel}>
    <View style={s.paymentPanelHeading}>
      <View style={s.panelIcon}><Ionicons name="card-outline" size={19} color={colors.primary} /></View>
      <View style={{ flex: 1 }}><Text style={s.panelTitle}>Pay invoice</Text><Text style={s.panelSubtitle}>{selectedInvoice.invoiceNumber} · {money(selectedInvoice.amount)}</Text></View>
      <TouchableOpacity accessibilityLabel="Close payment details" onPress={() => setExpandedInvoiceId(null)} style={s.closeButton}><Ionicons name="close" size={20} color={colors.subText} /></TouchableOpacity>
    </View>
    {paymentDetails.isDemo ? <View style={s.demoWarning}><Ionicons name="warning-outline" size={18} color="#A35B00" /><Text style={s.demoWarningText}>DEMO PAYMENT DETAILS — do not transfer money to this placeholder account.</Text></View> : null}
    <View style={s.bankCard}>
      <View style={s.bankHead}><View style={s.bankIcon}><Ionicons name="business-outline" size={19} color={colors.primary} /></View><View><Text style={s.bankName}>{paymentDetails.bankName}</Text><Text style={s.bankCaption}>Bank transfer details</Text></View></View>
      <View style={s.qrBlock}>{paymentDetails.qrCodeUrl ? <Image source={{ uri: paymentDetails.qrCodeUrl }} resizeMode="contain" style={s.qrImage} /> : <DemoQr colors={colors} styles={s} />}<Text style={s.qrCaption}>{paymentDetails.qrCodeUrl ? 'Scan bank QR' : 'DEMO QR · NOT SCANNABLE'}</Text></View>
      <CopyRow label="Account name" value={paymentDetails.accountName} onCopy={() => copyValue('Account name', paymentDetails.accountName)} styles={s} colors={colors} />
      <CopyRow label="Account number" value={paymentDetails.accountNumber} onCopy={() => copyValue('Account number', paymentDetails.accountNumber)} styles={s} colors={colors} />
    </View>
    <View style={s.methodsCallout}><Text style={s.methodsTitle}>Pay via eSewa, Khalti or bank transfer</Text><Text style={s.methodsBody}>Payments are not processed in the app yet. Pay in your wallet or bank app, then submit the transaction details and proof below.</Text></View>
    <Text style={s.formSectionTitle}>Submit payment proof</Text>
    <Text style={s.fieldLabel}>Mobile number <Text style={s.required}>*</Text></Text>
    <View style={s.inputWrap}><Ionicons name="call-outline" size={18} color={colors.subText} /><TextInput value={mobileNumber} onChangeText={setMobileNumber} placeholder="98XXXXXXXX" placeholderTextColor={colors.subText} keyboardType="phone-pad" style={s.input} maxLength={20} /></View>
    <Text style={s.fieldLabel}>Payment method</Text>
    <View style={s.methodSwitch}>
      {([{ id: 'WALLET', label: 'Wallet', icon: 'phone-portrait-outline' }, { id: 'BANK_TRANSFER', label: 'Bank transfer', icon: 'business-outline' }] as const).map(item => <TouchableOpacity key={item.id} onPress={() => setMethod(item.id)} style={[s.methodOption, method === item.id && s.methodOptionActive]}><Ionicons name={item.icon as any} size={17} color={method === item.id ? '#fff' : colors.subText} /><Text style={[s.methodText, method === item.id && s.methodTextActive]}>{item.label}</Text></TouchableOpacity>)}
    </View>
    <Text style={s.fieldLabel}>Transaction ID <Text style={s.required}>*</Text></Text>
    <View style={s.inputWrap}><Ionicons name="receipt-outline" size={18} color={colors.subText} /><TextInput value={transactionId} onChangeText={setTransactionId} placeholder="Enter transaction reference" placeholderTextColor={colors.subText} style={s.input} autoCapitalize="characters" maxLength={100} /></View>
    <Text style={s.fieldLabel}>Payment amount</Text>
    <View style={s.inputWrap}><Text style={s.currency}>NPR</Text><TextInput value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor={colors.subText} keyboardType="decimal-pad" style={s.input} /></View>
    <Text style={s.fieldLabel}>Payment screenshot / receipt <Text style={s.required}>*</Text></Text>
    <Text style={s.uploadHint}>One PDF or up to 2 photos · 5 MB total maximum</Text>
    <TouchableOpacity style={s.uploadButton} onPress={chooseProof}><Ionicons name="cloud-upload-outline" size={19} color={colors.primary} /><Text style={s.uploadButtonText}>{files.length ? 'Replace attached files' : 'Choose screenshots or PDF'}</Text><Ionicons name="add-circle-outline" size={20} color={colors.primary} /></TouchableOpacity>
    {files.map((file, index) => <View key={`${file.uri}-${index}`} style={s.fileRow}><View style={s.fileIcon}><Ionicons name={file.mimeType === 'application/pdf' ? 'document-text-outline' : 'image-outline'} size={17} color={colors.primary} /></View><View style={{ flex: 1 }}><Text numberOfLines={1} style={s.fileName}>{file.name}</Text><Text style={s.fileSize}>{(file.size / (1024 * 1024)).toFixed(2)} MB</Text></View><TouchableOpacity onPress={() => setFiles(current => current.filter((_, i) => i !== index))}><Ionicons name="close-circle" size={21} color={colors.subText} /></TouchableOpacity></View>)}
    <TouchableOpacity onPress={submitProof} disabled={submitting} style={[s.submitButton, submitting && { opacity: 0.65 }]}>{submitting ? <ActivityIndicator color="#fff" /> : <><Ionicons name="shield-checkmark-outline" size={19} color="#fff" /><Text style={s.submitText}>Submit payment proof</Text></>}</TouchableOpacity>
    <Text style={s.reviewNote}>The invoice remains due until the school verifies your payment.</Text>
  </View> : null;

  return <SafeAreaView style={s.screen}>
    <View style={s.header}>
      <TouchableOpacity accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={s.back}><Ionicons name="chevron-back" size={24} color={colors.text} /></TouchableOpacity>
      <View style={{ flex: 1 }}><Text style={s.eyebrow}>SCHOOL ACCOUNT</Text><Text style={s.title}>Fees</Text></View>
      <TouchableOpacity accessibilityLabel="Refresh fee records" onPress={() => load(true)} style={s.refresh}><Ionicons name="refresh" size={19} color={colors.primary} /></TouchableOpacity>
    </View>
    <View style={s.tabs}>{([{ id: 'STATEMENT', label: 'Statement', icon: 'stats-chart-outline' }, { id: 'INVOICES', label: 'Invoices', icon: 'receipt-outline' }] as const).map(item => <TouchableOpacity key={item.id} onPress={() => setPage(item.id)} style={[s.tab, page === item.id && s.tabActive]}><Ionicons name={item.icon as any} size={17} color={page === item.id ? colors.primary : colors.subText} /><Text style={[s.tabText, page === item.id && s.tabTextActive]}>{item.label}</Text></TouchableOpacity>)}</View>
    <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}>
      <View style={s.balanceCard}><View style={s.balanceTop}><View><Text style={s.balanceLabel}>TOTAL BALANCE DUE</Text><Text style={s.balanceAmount}>{money(totalDue)}</Text><Text style={s.balanceSub}>{due.length} unpaid {due.length === 1 ? 'invoice' : 'invoices'}</Text></View><View style={s.balanceIcon}><Ionicons name="wallet-outline" size={25} color="#fff" /></View></View><View style={s.balanceDivider} /><View style={s.paidSummary}><Ionicons name="checkmark-circle" size={17} color="#BDF5D4" /><Text style={s.paidSummaryText}>{money(totalPaid)} paid to date</Text><Text style={s.paidSummaryCount}>{paid.length} receipts</Text></View></View>
      {error ? <View style={s.errorBox}><Ionicons name="cloud-offline-outline" size={24} color={colors.danger} /><Text style={s.errorText}>{error}</Text><TouchableOpacity onPress={() => load()}><Text style={s.retryText}>Try again</Text></TouchableOpacity></View> : loading ? <View style={s.loading}><ActivityIndicator size="large" color={colors.primary} /><Text style={s.muted}>Loading your fee records…</Text></View> : page === 'STATEMENT' ? <>
        <View style={s.sectionHead}><View><Text style={s.sectionTitle}>Fee statement</Text><Text style={s.sectionSubtitle}>A summary of your billed and paid fees</Text></View><View style={s.countBadge}><Text style={s.countText}>{invoices.length} ITEMS</Text></View></View>
        {invoices.length ? <View style={s.tableOuter}><ScrollView horizontal showsHorizontalScrollIndicator><View style={s.table}>
          <View style={[s.tableRow, s.tableHeader]}><TableCell label="INVOICE" width={106} header styles={s} /><TableCell label="PARTICULARS" width={145} header styles={s} /><TableCell label="DUE DATE" width={104} header styles={s} /><TableCell label="AMOUNT" width={115} header styles={s} /><TableCell label="STATUS" width={110} header styles={s} /><TableCell label="ACTION" width={105} header styles={s} /></View>
          {invoices.map((invoice, index) => {
            const status = getStatus(invoice);
            return <View key={invoice.id} style={[s.tableRow, index % 2 === 1 && s.tableAlternate]}>
              <TableCell label={invoice.invoiceNumber} sublabel={`Issued ${date(invoice.issuedAt)}`} width={106} styles={s} />
              <TableCell label={invoice.title} sublabel={invoice.description || undefined} width={145} styles={s} />
              <TableCell label={invoice.status === 'PAID' && invoice.paidAt ? date(invoice.paidAt) : date(invoice.dueDate)} sublabel={invoice.status === 'PAID' ? 'Paid on' : 'Due'} width={104} styles={s} />
              <TableCell label={money(invoice.amount)} width={115} styles={s} strong />
              <View style={[s.tableCell, { width: 110 }]}><Text style={[s.statusPill, { color: status.color, backgroundColor: status.background }]}>{status.label}</Text></View>
              <View style={[s.tableCell, { width: 105 }]}>{invoice.status === 'PAID' ? <Text style={s.noAction}>—</Text> : <TouchableOpacity onPress={() => openPayment(invoice)} style={[s.miniPay, invoice.latestProofStatus === 'PENDING' && s.miniPayDisabled]}><Text style={s.miniPayText}>{invoice.latestProofStatus === 'PENDING' ? 'Pending' : 'Pay now'}</Text></TouchableOpacity>}</View>
            </View>;
          })}
          <View style={[s.tableRow, s.tableTotal]}><View style={[s.tableCell, { width: 106 }]} /><View style={[s.tableCell, { width: 145 }]}><Text style={s.totalLabel}>TOTAL DUE</Text></View><View style={[s.tableCell, { width: 104 }]} /><View style={[s.tableCell, { width: 115 }]}><Text style={s.totalAmount}>{money(totalDue)}</Text></View><View style={[s.tableCell, { width: 110 }]} /><View style={[s.tableCell, { width: 105 }]} /></View>
        </View></ScrollView></View> : <EmptyState title="No statement yet" message="Fee invoices from your school will appear here." styles={s} colors={colors} />}
        {proofPanel}
      </> : <>
        <View style={s.sectionHead}><View><Text style={s.sectionTitle}>Your invoices</Text><Text style={s.sectionSubtitle}>Paid receipts and outstanding fees</Text></View><Ionicons name="receipt-outline" size={22} color={colors.primary} /></View>
        <View style={s.filters}>{(['ALL', 'DUE', 'PAID'] as const).map(item => <TouchableOpacity key={item} onPress={() => setFilter(item)} style={[s.filter, filter === item && s.filterActive]}><Text style={[s.filterText, filter === item && s.filterTextActive]}>{item === 'ALL' ? `All · ${invoices.length}` : item === 'DUE' ? `Due · ${due.length}` : `Paid · ${paid.length}`}</Text></TouchableOpacity>)}</View>
        {visibleInvoices.length ? visibleInvoices.map(invoice => {
          const status = getStatus(invoice);
          return <View key={invoice.id} style={s.invoiceCard}>
            <View style={s.invoiceColorStripe} />
            <View style={s.invoiceContent}>
              <View style={s.invoiceCardTop}><View style={s.invoiceIcon}><Ionicons name="document-text-outline" size={20} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={s.invoiceNumber}>{invoice.invoiceNumber}</Text><Text style={s.invoiceDate}>Issued {date(invoice.issuedAt)}</Text></View><Text style={[s.statusPill, { color: status.color, backgroundColor: status.background }]}>{status.label}</Text></View>
              <Text style={s.invoiceTitle}>{invoice.title}</Text>{invoice.description ? <Text style={s.invoiceDescription}>{invoice.description}</Text> : null}
              <View style={s.invoiceBottom}><View><Text style={s.detailLabel}>{invoice.status === 'PAID' && invoice.paidAt ? 'PAID ON' : 'DUE DATE'}</Text><Text style={s.detailValue}>{date(invoice.status === 'PAID' && invoice.paidAt ? invoice.paidAt : invoice.dueDate)}</Text></View><Text style={s.invoiceAmount}>{money(invoice.amount)}</Text></View>
              {invoice.status !== 'PAID' ? <TouchableOpacity style={[s.payButton, invoice.latestProofStatus === 'PENDING' && s.payButtonDisabled]} onPress={() => openPayment(invoice)}><Ionicons name={invoice.latestProofStatus === 'PENDING' ? 'time-outline' : 'card-outline'} size={17} color={invoice.latestProofStatus === 'PENDING' ? colors.subText : '#fff'} /><Text style={[s.payButtonText, invoice.latestProofStatus === 'PENDING' && { color: colors.subText }]}>{invoice.latestProofStatus === 'PENDING' ? 'Payment proof under review' : 'Pay now'}</Text></TouchableOpacity> : null}
            </View>
          </View>;
        }) : <EmptyState title={filter === 'PAID' ? 'No paid invoices yet' : filter === 'DUE' ? 'You’re all caught up' : 'No invoices yet'} message={filter === 'DUE' ? 'There are no outstanding fees on your account.' : 'Invoices from your school will appear here.'} styles={s} colors={colors} />}
        {proofPanel}
      </>}
    </ScrollView>
    <BottomNavigation navigation={navigation} activeRoute="Fees" colors={colors} />
  </SafeAreaView>;
}

function TableCell({ label, sublabel, width, header, strong, styles }: any) {
  return <View style={[styles.tableCell, { width }]}>{header ? <Text style={styles.tableHeaderText}>{label}</Text> : <><Text numberOfLines={2} style={[styles.tablePrimary, strong && styles.tableStrong]}>{label}</Text>{sublabel ? <Text numberOfLines={2} style={styles.tableSecondary}>{sublabel}</Text> : null}</>}</View>;
}

function CopyRow({ label, value, onCopy, styles, colors }: any) {
  return <View style={styles.copyRow}><View style={{ flex: 1 }}><Text style={styles.copyLabel}>{label}</Text><Text selectable style={styles.copyValue}>{value}</Text></View><TouchableOpacity onPress={onCopy} accessibilityLabel={`Copy ${label}`} style={styles.copyButton}><Ionicons name="copy-outline" size={17} color={colors.primary} /><Text style={styles.copyButtonText}>Copy</Text></TouchableOpacity></View>;
}

function DemoQr({ colors, styles }: any) {
  const cells = Array.from({ length: 21 * 21 }, (_, i) => {
    const x = i % 21;
    const y = Math.floor(i / 21);
    const finderAt = (fx: number, fy: number) => {
      const dx = x - fx; const dy = y - fy;
      if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return null;
      return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
    };
    const finder = finderAt(0, 0) ?? finderAt(14, 0) ?? finderAt(0, 14);
    return finder ?? ((x * 13 + y * 19 + x * y * 3) % 7 < 3);
  });
  return <View style={[styles.qrFrame, { borderColor: colors.border }]}><View style={styles.qrGrid}>{cells.map((filled, index) => <View key={index} style={[styles.qrCell, filled && styles.qrCellFilled]} />)}<View style={styles.qrDemoTag}><Text style={styles.qrDemoText}>DEMO</Text></View></View></View>;
}

function EmptyState({ title, message, styles, colors }: any) {
  return <View style={styles.emptyState}><View style={styles.emptyIcon}><Ionicons name="receipt-outline" size={26} color={colors.primary} /></View><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyMessage}>{message}</Text></View>;
}

const makeStyles = (c: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border },
  back: { padding: 6, marginRight: 9 }, eyebrow: { fontSize: 9, letterSpacing: 1.2, fontWeight: '900', color: c.subText }, title: { color: c.text, fontSize: 22, fontWeight: '900', marginTop: 1 },
  refresh: { padding: 10, backgroundColor: c.mutedSurface, borderRadius: 12 },
  tabs: { flexDirection: 'row', paddingHorizontal: 17, paddingTop: 12, backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, paddingVertical: 11, borderBottomWidth: 2, borderBottomColor: 'transparent' }, tabActive: { borderBottomColor: c.primary }, tabText: { color: c.subText, fontSize: 13, fontWeight: '700' }, tabTextActive: { color: c.primary, fontWeight: '900' },
  content: { padding: 16, paddingBottom: 34 },
  balanceCard: { borderRadius: 21, padding: 17, backgroundColor: c.primary, overflow: 'hidden' }, balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, balanceLabel: { color: '#FFFFFFC9', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 }, balanceAmount: { color: '#fff', fontSize: 27, fontWeight: '900', marginTop: 6 }, balanceSub: { color: '#FFFFFFCC', fontSize: 11, marginTop: 3 }, balanceIcon: { width: 49, height: 49, borderRadius: 16, backgroundColor: '#FFFFFF20', alignItems: 'center', justifyContent: 'center' }, balanceDivider: { height: 1, backgroundColor: '#FFFFFF35', marginVertical: 14 }, paidSummary: { flexDirection: 'row', alignItems: 'center', gap: 7 }, paidSummaryText: { color: '#fff', fontSize: 12, fontWeight: '700', flex: 1 }, paidSummaryCount: { color: '#FFFFFFC9', fontSize: 11 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 23, marginBottom: 12 }, sectionTitle: { color: c.text, fontSize: 18, fontWeight: '900' }, sectionSubtitle: { color: c.subText, fontSize: 11, marginTop: 3 }, countBadge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9, backgroundColor: c.primary + '13' }, countText: { color: c.primary, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  tableOuter: { borderWidth: 1, borderColor: c.border, borderRadius: 15, overflow: 'hidden', backgroundColor: c.card }, table: { minWidth: 685 }, tableRow: { flexDirection: 'row', minHeight: 61, borderBottomWidth: 1, borderBottomColor: c.border, alignItems: 'stretch' }, tableHeader: { minHeight: 40, backgroundColor: c.primary }, tableAlternate: { backgroundColor: c.mutedSurface }, tableTotal: { backgroundColor: c.primary + '10', borderBottomWidth: 0 }, tableCell: { justifyContent: 'center', paddingHorizontal: 9, paddingVertical: 8, borderRightWidth: 1, borderRightColor: c.border }, tableHeaderText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }, tablePrimary: { color: c.text, fontSize: 10, fontWeight: '800' }, tableStrong: { color: c.primary, fontSize: 11 }, tableSecondary: { color: c.subText, fontSize: 9, marginTop: 3, lineHeight: 12 }, statusPill: { alignSelf: 'flex-start', overflow: 'hidden', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 5, fontSize: 9, fontWeight: '900' }, miniPay: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 7, backgroundColor: c.primary }, miniPayDisabled: { backgroundColor: c.mutedSurface }, miniPayText: { color: '#fff', fontSize: 9, fontWeight: '900' }, noAction: { color: c.subText, fontSize: 12 }, totalLabel: { color: c.primary, fontSize: 10, fontWeight: '900' }, totalAmount: { color: c.primary, fontSize: 11, fontWeight: '900' },
  paymentPanel: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 19, padding: 15, marginTop: 15 }, paymentPanelHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 13 }, panelIcon: { width: 39, height: 39, borderRadius: 12, backgroundColor: c.primary + '14', alignItems: 'center', justifyContent: 'center' }, panelTitle: { color: c.text, fontSize: 16, fontWeight: '900' }, panelSubtitle: { color: c.subText, fontSize: 11, marginTop: 3 }, closeButton: { padding: 6 },
  demoWarning: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 11, backgroundColor: '#FFF3D6', borderWidth: 1, borderColor: '#F4D38A', marginBottom: 12 }, demoWarningText: { color: '#784700', fontSize: 10, lineHeight: 15, fontWeight: '900', flex: 1 }, bankCard: { borderWidth: 1, borderColor: c.border, borderRadius: 15, padding: 13, backgroundColor: c.background }, bankHead: { flexDirection: 'row', alignItems: 'center', gap: 9 }, bankIcon: { width: 35, height: 35, borderRadius: 11, backgroundColor: c.primary + '14', alignItems: 'center', justifyContent: 'center' }, bankName: { color: c.text, fontSize: 13, fontWeight: '900' }, bankCaption: { color: c.subText, fontSize: 10, marginTop: 2 }, qrBlock: { alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: c.border, marginBottom: 6 }, qrFrame: { backgroundColor: '#fff', borderWidth: 1, borderRadius: 13, padding: 9 }, qrImage: { width: 160, height: 160, backgroundColor: '#fff', borderRadius: 12 }, qrGrid: { width: 160, height: 160, flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', position: 'relative' }, qrCell: { width: '4.7619%', height: '4.7619%', backgroundColor: '#fff' }, qrCellFilled: { backgroundColor: '#1C2541' }, qrDemoTag: { position: 'absolute', alignSelf: 'center', top: 67, backgroundColor: '#fff', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#1C2541' }, qrDemoText: { color: '#1C2541', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, qrCaption: { color: c.danger, fontSize: 9, fontWeight: '900', letterSpacing: 0.8, marginTop: 7 }, copyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border }, copyLabel: { color: c.subText, fontSize: 9, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' }, copyValue: { color: c.text, fontSize: 13, fontWeight: '800', marginTop: 4 }, copyButton: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.primary + '13', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9 }, copyButtonText: { color: c.primary, fontSize: 10, fontWeight: '900' },
  methodsCallout: { backgroundColor: '#F3EDFF', borderWidth: 1, borderColor: '#DDD0FF', padding: 12, borderRadius: 13, marginTop: 12 }, methodsTitle: { color: '#5530A5', fontSize: 12, fontWeight: '900' }, methodsBody: { color: '#68588D', fontSize: 10, lineHeight: 15, marginTop: 4 }, formSectionTitle: { color: c.text, fontSize: 15, fontWeight: '900', marginTop: 20, marginBottom: 2 }, fieldLabel: { color: c.text, fontSize: 11, fontWeight: '800', marginTop: 13, marginBottom: 6 }, required: { color: c.danger }, inputWrap: { minHeight: 47, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 11, borderWidth: 1, borderColor: c.border, backgroundColor: c.background, paddingHorizontal: 12 }, input: { flex: 1, color: c.text, fontSize: 13, paddingVertical: 10 }, currency: { color: c.subText, fontSize: 11, fontWeight: '900' }, methodSwitch: { flexDirection: 'row', gap: 8 }, methodOption: { flex: 1, minHeight: 43, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: c.border, backgroundColor: c.background, borderRadius: 11 }, methodOptionActive: { backgroundColor: c.primary, borderColor: c.primary }, methodText: { color: c.subText, fontSize: 10, fontWeight: '800' }, methodTextActive: { color: '#fff' }, uploadHint: { color: c.subText, fontSize: 10, marginTop: -2, marginBottom: 8 }, uploadButton: { minHeight: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: c.primary, borderRadius: 11, backgroundColor: c.primary + '08' }, uploadButtonText: { color: c.primary, fontSize: 11, fontWeight: '800', flex: 1, marginLeft: 8 }, fileRow: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 9, borderRadius: 10, backgroundColor: c.mutedSurface, marginTop: 7 }, fileIcon: { width: 31, height: 31, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary + '15' }, fileName: { color: c.text, fontSize: 10, fontWeight: '800' }, fileSize: { color: c.subText, fontSize: 9, marginTop: 2 }, submitButton: { minHeight: 49, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: c.primary, marginTop: 15 }, submitText: { color: '#fff', fontSize: 12, fontWeight: '900' }, reviewNote: { color: c.subText, fontSize: 9, textAlign: 'center', lineHeight: 14, marginTop: 9 },
  filters: { flexDirection: 'row', gap: 7, marginBottom: 12 }, filter: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.card }, filterActive: { backgroundColor: c.primary, borderColor: c.primary }, filterText: { color: c.subText, fontSize: 10, fontWeight: '800' }, filterTextActive: { color: '#fff' }, invoiceCard: { flexDirection: 'row', overflow: 'hidden', borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, marginBottom: 11 }, invoiceColorStripe: { width: 5, backgroundColor: c.primary }, invoiceContent: { flex: 1, padding: 13 }, invoiceCardTop: { flexDirection: 'row', alignItems: 'center', gap: 9 }, invoiceIcon: { width: 39, height: 39, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: c.primary + '14' }, invoiceNumber: { color: c.text, fontSize: 12, fontWeight: '900' }, invoiceDate: { color: c.subText, fontSize: 9, marginTop: 3 }, invoiceTitle: { color: c.text, fontSize: 14, fontWeight: '900', marginTop: 13 }, invoiceDescription: { color: c.subText, fontSize: 10, lineHeight: 15, marginTop: 3 }, invoiceBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 13, paddingTop: 10, borderTopWidth: 1, borderColor: c.border }, detailLabel: { color: c.subText, fontSize: 8, letterSpacing: 0.8, fontWeight: '900' }, detailValue: { color: c.text, fontSize: 10, fontWeight: '800', marginTop: 3 }, invoiceAmount: { color: c.primary, fontSize: 16, fontWeight: '900' }, payButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 39, marginTop: 12, borderRadius: 10, backgroundColor: c.primary }, payButtonDisabled: { backgroundColor: c.mutedSurface }, payButtonText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  loading: { minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 9 }, muted: { color: c.subText, fontSize: 11 }, errorBox: { alignItems: 'center', paddingVertical: 28, gap: 9 }, errorText: { color: c.subText, fontSize: 11, textAlign: 'center' }, retryText: { color: c.primary, fontSize: 11, fontWeight: '900' }, emptyState: { alignItems: 'center', padding: 28, borderRadius: 15, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, emptyIcon: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: c.primary + '14' }, emptyTitle: { color: c.text, fontSize: 14, fontWeight: '900', marginTop: 11 }, emptyMessage: { color: c.subText, fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 5 },
});
