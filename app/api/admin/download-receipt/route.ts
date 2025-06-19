import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url!);
  const id = url.searchParams.get('id');
  if (!id) {
    return new NextResponse('Missing id', { status: 400 });
  }

  // Fetch the receipt base64, mime, and filename from the database
  const result = await query(
    'SELECT receipt_base64, receipt_mime, receipt_filename FROM transactions WHERE id = $1',
    [id]
  );

  if (!result.length || !result[0].receipt_base64) {
    return new NextResponse('Receipt not found', { status: 404 });
  }

  const { receipt_base64, receipt_mime, receipt_filename } = result[0];
  const buffer = Buffer.from(receipt_base64, 'base64');

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': receipt_mime || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${receipt_filename || 'receipt'}"`,
    },
  });
}
