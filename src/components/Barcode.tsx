'use client';

import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
}

export default function Barcode({
  value,
  width = 2,
  height = 50,
  displayValue = true
}: BarcodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        width,
        height,
        displayValue,
        fontSize: 14,
        margin: 10,
      });
    }
  }, [value, width, height, displayValue]);

  return <svg ref={svgRef} />;
}
