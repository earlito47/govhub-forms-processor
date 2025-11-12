export class LayoutManager {
  handleOverflow(text: string, maxLength: number): string {
    return text.substring(0, maxLength);
  }
}
