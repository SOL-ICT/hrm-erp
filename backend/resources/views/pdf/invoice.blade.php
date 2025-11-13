<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice</title>
    <style>
        @page {
            size: A4;
            margin: 1.5cm 1cm 1.5cm 2cm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', 'Arial', sans-serif;
            font-size: 10px;
            line-height: 1.0;
            color: #000;
            max-width: 17cm;
            height: 26cm;
            padding-left: 1cm;
            padding-right: 0.5cm;
        }

        .header {
            margin-bottom: 8px;
            position: relative;
            text-align: center;
            margin-top: 0.3cm;
        }

        .logo {
            width: 100px;
            height: auto;
            margin-bottom: 8px;
        }

        .header-info {
            display: table;
            width: 100%;
            margin-bottom: 8px;
        }

        .header-left {
            display: table-cell;
            width: 40%;
            vertical-align: top;
        }

        .header-right {
            display: table-cell;
            width: 60%;
            vertical-align: top;
            text-align: right;
            padding-right: 0.5cm;
        }

        .confidential {
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 8px;
        }

        .info-line {
            margin-bottom: 2px;
        }

        .title {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            margin: 15px 0 5px 0;
        }

        .subtitle {
            text-align: center;
            font-style: italic;
            font-size: 12px;
            margin-bottom: 15px;
        }

        .description {
            margin-bottom: 15px;
            font-style: italic;
        }

        .to-section {
            margin-bottom: 15px;
        }

        .to-section div {
            margin-bottom: 3px;
        }

        .period {
            margin: 15px 0;
            font-weight: bold;
        }

        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }

        .invoice-table th,
        .invoice-table td {
            border: 1px solid #000;
            padding: 6px;
            text-align: left;
        }

        .invoice-table th {
            background-color: #f5f5f5;
            font-weight: bold;
        }

        .invoice-table .amount {
            text-align: right;
        }

        .invoice-table .item-col {
            width: 10%;
            text-align: center;
        }

        .invoice-table .desc-col {
            width: 60%;
        }

        .invoice-table .amount-col {
            width: 30%;
        }

        .amount-words {
            margin: 15px 0;
            font-weight: bold;
        }

        .banking-request {
            margin: 15px 0;
            font-weight: bold;
        }

        .banking-details {
            margin: 12px 0;
        }

        .banking-details div {
            margin-bottom: 3px;
        }

        .tax-info {
            margin: 12px 0;
        }

        .tax-info div {
            margin-bottom: 3px;
        }

        .thank-you {
            margin: 15px 0;
        }

        .company-name {
            margin: 8px 0;
            font-weight: bold;
        }

        .disclaimer {
            margin-top: 8px;
            font-size: 8px;
            text-align: left;
        }

        .disclaimer-header {
            font-weight: bold;
            margin-bottom: 5px;
        }

        .disclaimer ol {
            margin: 0;
            padding-left: 15px;
        }

        .disclaimer li {
            margin-bottom: 3px;
        }

        /* FIRS QR Code Section Styles */
        .firs-qr-section {
            display: table;
            width: 100%;
            margin-top: 15px;
            padding: 8px;
            background-color: #f9f9f9;
            border: 1px solid #4caf50;
            border-radius: 4px;
        }

        .firs-qr-info {
            display: table-cell;
            width: 65%;
            vertical-align: middle;
            font-size: 10px;
            line-height: 1.2;
        }

        .firs-qr-info div {
            margin-bottom: 2px;
        }

        .firs-qr-display {
            display: table-cell;
            width: 35%;
            vertical-align: middle;
            text-align: center;
        }

        .firs-qr-image {
            width: 150px;
            height: 150px;
            border: 1px solid #333;
            border-radius: 2px;
            /* Prevent image scaling artifacts that could corrupt QR pattern */
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
        }

        .firs-qr-caption {
            font-size: 8px;
            margin-top: 3px;
            font-weight: bold;
            color: #333;
        }

        .firs-qr-placeholder {
            display: table-cell;
            width: 30%;
            vertical-align: middle;
            text-align: center;
        }

        .firs-qr-missing {
            width: 120px;
            height: 120px;
            border: 2px dashed #ccc;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #666;
            background-color: #f5f5f5;
        }

        .supplier-customer-info {
            display: table;
            width: 100%;
            margin: 15px 0;
        }

        .supplier-info,
        .customer-info {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding: 0 10px;
        }

        .party-header {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 6px;
            color: #333;
        }

        .party-details {
            font-size: 10px;
            line-height: 1.3;
        }

        .party-details div {
            margin-bottom: 2px;
        }

        /* FIRS Compliance Notice */
        .firs-compliance-notice {
            background-color: #e8f5e8;
            border: 1px solid #4caf50;
            padding: 4px;
            margin: 5px 0;
            text-align: center;
            font-size: 9px;
            font-weight: bold;
            color: #2e7d32;
            border-radius: 3px;
        }
    </style>
</head>

<body>
    <!-- Header with logo and info -->
    <div class="header">
        @if($logo_base64)
        <img src="data:image/png;base64,{{ $logo_base64 }}" alt="SOL Logo" class="logo">
        @endif
    </div>

    <!-- Title and Subtitle immediately after logo -->
    <div class="title">OUTSOURCED STAFF COST AND MANAGEMENT FEE INVOICE</div>
    <div class="subtitle">Provision & Management of Support Staff</div>
    @if(isset($firs_data) && $firs_data)
    <!-- FIRS Compliance Notice -->
    <div class="firs-compliance-notice">
        <strong>🛡️ FIRS E-INVOICE COMPLIANT</strong> - This invoice has been validated with the Federal Inland Revenue Service (FIRS) for tax compliance.
        @if(isset($firs_data['approval_date']) && $firs_data['approval_date'])
        Approved on: {{ $firs_data['approval_date'] }}
        @endif
    </div>
    @endif

    <div class="header-info">
        <div class="header-left">
            <!-- Business ID - Always shown (hardcoded) -->
            <div class="info-line"><strong>Business ID:</strong> 49574f35-c1ea-4533-9618-30048df5aced</div>
            @if(isset($firs_data) && $firs_data)
            <!-- FIRS Compliance Information -->
            <div class="info-line"><strong>TIN:</strong> {{ $firs_data['accounting_supplier_party']['tin'] ?? $tin ?? 'N/A' }}</div>
            <div class="info-line"><strong>IRN:</strong> {{ $firs_data['irn'] ?? 'N/A' }}</div>
            @endif
        </div>
        <div class="header-right">
            <div class="confidential">OFFICIAL INVOICE</div>
            <div class="info-line"><strong>Issue Date:</strong> {{ date('Y-m-d', strtotime($issue_date)) }}</div>
            @if(isset($firs_data) && $firs_data)
            <div class="info-line"><strong>Invoice Type Code:</strong> {{ $firs_data['invoice_type_code'] ?? '380' }}</div>
            @endif
            <div class="info-line"><strong>Buyer Reference:</strong> {{ $external_order }}</div>
            @if(isset($firs_data) && $firs_data)
            <div class="info-line"><strong>Document Currency:</strong> {{ $firs_data['document_currency_code'] ?? 'NGN' }} | <strong>Tax Currency:</strong> {{ $firs_data['tax_currency_code'] ?? 'NGN' }}</div>
            @endif
            <div class="info-line"><strong>Payment Terms:</strong> {{ $payment_terms }}</div>
            @if(isset($firs_data) && isset($firs_data['invoice_delivery_period']))
            <div class="info-line"><strong>Service Period:</strong> {{ $firs_data['invoice_delivery_period']['start_date'] }} to {{ $firs_data['invoice_delivery_period']['end_date'] }}</div>
            @endif
            @if(isset($firs_data) && isset($firs_data['order_reference']))
            <div class="info-line"><strong>Order Reference:</strong> {{ $firs_data['order_reference'] }}</div>
            @endif
            @if(isset($firs_data) && isset($firs_data['billing_reference']) && !empty($firs_data['billing_reference']))
            <div class="info-line"><strong>Billing Reference:</strong>
                @foreach($firs_data['billing_reference'] as $index => $ref)
                {{ $ref['irn'] ?? '' }}
                @if($ref['issue_date'] ?? '')
                ({{ $ref['issue_date'] }})
                @endif
                @if(!$loop->last), @endif
                @endforeach
            </div>
            @endif
        </div>
    </div>

    <!-- Service Description -->
    <div class="description">{{ $service_description }}</div>

    <!-- To Section -->
    <div class="to-section">
        <div><strong>To:</strong> {{ $contact_person_position }}</div>
        <div style="margin-left: 15px;">{{ $contact_person_address }}</div>
        <div style="margin-top: 8px;"><strong>Attention:</strong> {{ $contact_person_name }}</div>
    </div>

    <!-- Period -->
    <div class="period">Period: {{ $period }}</div>

    @if(isset($firs_data) && $firs_data)
    <!-- Enhanced Customer and Supplier Information for FIRS (Customer LEFT, Supplier RIGHT) -->
    <div class="supplier-customer-info">
        <div class="customer-info">
            <div class="party-header">ACCOUNTING CUSTOMER PARTY</div>
            <div class="party-details">
                @if(isset($firs_data['accounting_customer_party']))
                <div><strong>Name:</strong> {{ $firs_data['accounting_customer_party']['party_name'] ?? 'N/A' }}</div>
                <div><strong>TIN:</strong> {{ $firs_data['accounting_customer_party']['tin'] ?? 'N/A' }}</div>
                <div><strong>Email:</strong> {{ $firs_data['accounting_customer_party']['email'] ?? 'N/A' }}</div>
                <div><strong>Phone:</strong> {{ $firs_data['accounting_customer_party']['telephone'] ?? 'N/A' }}</div>
                @if(isset($firs_data['accounting_customer_party']['postal_address']))
                <div><strong>Address:</strong> {{ $firs_data['accounting_customer_party']['postal_address']['street_name'] ?? '' }},
                    {{ $firs_data['accounting_customer_party']['postal_address']['city_name'] ?? '' }}
                </div>
                @endif
                @endif
            </div>
        </div>
        <div class="supplier-info">
            <div class="party-header">ACCOUNTING SUPPLIER PARTY</div>
            <div class="party-details">
                @if(isset($firs_data['accounting_supplier_party']))
                <div><strong>Name:</strong> {{ $firs_data['accounting_supplier_party']['party_name'] ?? 'Strategic Outsourcing Limited' }}</div>
                <div><strong>TIN:</strong> {{ $firs_data['accounting_supplier_party']['tin'] ?? '32506532-0001' }}</div>
                <div><strong>Email:</strong> {{ $firs_data['accounting_supplier_party']['email'] ?? 'info@strategicoutsourcing.com.ng' }}</div>
                <div><strong>Phone:</strong> {{ $firs_data['accounting_supplier_party']['telephone'] ?? '+234-803-123-4567' }}</div>
                @if(isset($firs_data['accounting_supplier_party']['postal_address']))
                <div><strong>Address:</strong> {{ $firs_data['accounting_supplier_party']['postal_address']['street_name'] ?? 'Plot 1665, Oyin Jolayemi Street' }},
                    {{ $firs_data['accounting_supplier_party']['postal_address']['city_name'] ?? 'Lagos' }}
                </div>
                @endif
                @endif
            </div>
        </div>
    </div>
    @endif

    <!-- Invoice Table -->
    <table class="invoice-table">
        <thead>
            <tr>
                <th class="item-col">Item</th>
                <th class="desc-col">Description</th>
                <th class="amount-col">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice_table_data as $row)
            <tr>
                <td class="item-col">{{ $row['item'] }}</td>
                <td class="desc-col">{{ $row['description'] }}</td>
                <td class="amount">₦{{ number_format($row['amount'], 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Amount in Words -->
    <div class="amount-words">
        Amount in Words: {{ $amount_in_words }}
    </div>

    <!-- Banking Request -->
    <div class="banking-request">
        Kindly credit our Account below with the amount due
    </div>

    <!-- Banking Details -->
    <div class="banking-details">
        <div><strong>Bank Name:</strong> {{ $bank_name }}</div>
        <div><strong>Account Name:</strong> {{ $account_name }}</div>
        <div><strong>Account Number:</strong> {{ $account_number }}</div>
    </div>



    <!-- Thank You -->
    <div class="thank-you">
        {{ $thank_you_message }}
    </div>

    <!-- Company Name -->
    <div class="company-name">
        For: {{ $company_name }}
    </div>

    <!-- Disclaimer -->
    <div class="disclaimer">
        <div class="disclaimer-header">NOTES:</div>
        <ol>
            <li>Prepared under IFRS 15, where revenue represents earned consideration from goods or services transferred, directly impacting retained earnings and equity.</li>
            <li>This is an electronically generated invoice and remains valid without physical signature or company seal.</li>
        </ol>
    </div>

    @if(isset($firs_data) && $firs_data)
    <!-- FIRS QR Code Section (replaces the compliance footer) -->
    <div class="firs-qr-section">
        <div class="firs-qr-info">
            <div><strong>FIRS E-Invoice Verification</strong></div>
            @if(isset($firs_data['irn']))
            <div>IRN: {{ $firs_data['irn'] }}</div>
            @endif
            @if(isset($firs_data['approval_date']) && $firs_data['approval_date'])
            <div>Validated: {{ $firs_data['approval_date'] }}</div>
            @endif
        </div>
        @if(isset($firs_qr_code) && $firs_qr_code)
        <div class="firs-qr-display">
            <img src="{{ $firs_qr_code }}" alt="FIRS QR Code" class="firs-qr-image">
            <div class="firs-qr-caption">Scan for FIRS Verification</div>
        </div>
        @else
        <div class="firs-qr-placeholder">
            <div class="firs-qr-missing">QR Code Not Available</div>
        </div>
        @endif
    </div>
    @endif
</body>

</html>