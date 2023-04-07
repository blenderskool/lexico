class Node<T> {
  nodes: Record<string, Node<T>> = {};
  end: T[];
}

/**
 * Prefix based trie that stores the record(referred to as `value`)
 * in the array of "end" nodes.
 */
export class Trie<T> {
  trie: Node<T> = new Node();

  add(key: string, value: T) {
    key = key.toLowerCase();

    let top = this.trie;
    for (let i = 0; i < key.length; ++i) {
      const ch = key[i];

      top.nodes[ch] ??= new Node<T>();
      top = top.nodes[ch];
    }

    top.end ??= [];
    top.end.push(value);
  }

  searchAll(key: string): T[] {
    key = key.toLowerCase();

    let top = this.trie;
    for (let i = 0; i < key.length; ++i) {
      const ch = key[i];
      if (!top.nodes[ch]) return [];

      top = top.nodes[ch];
    }

    // DFS through all children nodes as they are part of the result
    return this.getAllValues(top);
  }

  private getAllValues(top: Node<T>): T[] {
    if (top.end) return top.end;
    return Object.values(top).flatMap((node) => this.getAllValues(node));
  }
}
