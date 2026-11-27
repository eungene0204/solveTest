// PDF 한 쪽의 일부를 PNG로 잘라낸다 (macOS PDFKit).
// 사용법: swift scripts/crop-pdf.swift <pdf> <쪽> <x0> <y0> <x1> <y1> <배율> <출력.png>
// 좌표는 쪽 크기에 대한 비율(0~1), 왼쪽 위가 (0,0).
import AppKit
import PDFKit

let a = CommandLine.arguments
guard a.count == 9, let doc = PDFDocument(url: URL(fileURLWithPath: a[1])),
      let pageNo = Int(a[2]), let page = doc.page(at: pageNo - 1),
      let x0 = Double(a[3]), let y0 = Double(a[4]), let x1 = Double(a[5]), let y1 = Double(a[6]),
      let scale = Double(a[7]) else {
  FileHandle.standardError.write("사용법: crop-pdf.swift <pdf> <쪽> <x0> <y0> <x1> <y1> <배율> <출력.png>\n".data(using: .utf8)!)
  exit(1)
}
let b = page.bounds(for: .mediaBox)
let w = (x1 - x0) * b.width, h = (y1 - y0) * b.height
let pxW = Int(w * scale), pxH = Int(h * scale)
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: pxW, pixelsHigh: pxH, bitsPerSample: 8,
                           samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB,
                           bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
let ctx = NSGraphicsContext.current!.cgContext
ctx.setFillColor(NSColor.white.cgColor)
ctx.fill(CGRect(x: 0, y: 0, width: pxW, height: pxH))
ctx.scaleBy(x: scale, y: scale)
// PDF 좌표는 왼쪽 아래가 원점이다.
ctx.translateBy(x: -x0 * b.width, y: -(1 - y1) * b.height)
page.draw(with: .mediaBox, to: ctx)
NSGraphicsContext.restoreGraphicsState()
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: a[8]))
