


Dưới đây là **một file Markdown hoàn chỉnh** để cậu copy thử vào renderer của mình. Tớ tránh đặt nó trong code block để khi cậu copy thì **markdown vẫn hoạt động đúng**.

---

# Markdown Rendering Test

## Headings

# H1 Title

## H2 Section

### H3 Subsection

#### H4

##### H5

# H6

---

## Paragraph

This is a normal paragraph.

This is another paragraph separated by a blank line.

Line break example:
Hello
World

---

## Text Formatting

*italic text*

**bold text**

***bold italic***

~~strikethrough~~

`inline code`

---

## Lists

### Unordered List

* apple
* banana
* orange

### Nested List

* AI

  * LLM
  * Vision
  * Robotics

### Ordered List

1. first
2. second
3. third

---

## Links

[OpenAI](https://openai.com)

Reference style link:

[OpenAI Reference][1]

[1]: https://openai.com

---

## Images

![Sample Image](https://picsum.photos/200)

---

## Blockquote

> This is a quote

Nested quote:

> Level 1
>
> > Level 2

---

## Code Blocks

Inline code example: `print("hello")`

### Python

```python
print("hello world")
for i in range(3):
    print(i)
```

### JavaScript

```javascript
function greet() {
  console.log("hello");
}
greet();
```

### Diff Example

```diff
+ added line
- removed line
```

---

## Tables

| Name  | Age |
| ----- | --- |
| Alice | 20  |
| Bob   | 25  |

Alignment example:

| Left | Center | Right |
| :--- | :----: | ----: |
| A    |    B   |     C |
| D    |    E   |     F |

---

## Task List

* [x] finished task
* [ ] unfinished task
* [ ] another task

---

## Horizontal Rule

---

---

---

## Footnotes

Here is a sentence with a footnote.[^1]

[^1]: This is the footnote text.

---

## Math (if supported)

Inline math: $E = mc^2$

Block math:

$$
\int_0^\infty x^2 dx
$$

---

## HTML inside Markdown

<div style="color:red">
This text uses raw HTML styling.
</div>

---

## Collapsible Section

<details>
<summary>Click to expand</summary>

Hidden content inside the collapsible section.

</details>

---

## Definition List (not supported everywhere)

Term
: Definition of the term

---

## Emoji

🚀 🧠 📚 😄

---

## Keyboard Keys

Press `Ctrl + C` to copy.

---

## Diagram (Mermaid if supported)

```mermaid
graph TD
A[Start] --> B[Idea]
B --> C[Experiment]
C --> D[Result]
```

---

## Metadata / Frontmatter (for blog engines)

```
---
title: Markdown Test
date: 2026-03-06
tags: [markdown, test]
---
```

---

## Sample Homepage Section

# Hi, I'm Ope

I build experiments in AI and interfaces.

## Projects

* AI Memory System
* Gesture Mouse
* Tiny LLM experiments

## Notes

* Transformer ideas
* TTS experiments
* UI design thoughts

## Contact

GitHub • Email

---

🏠 Một câu tiếng Anh nhỏ:

"I'm testing whether my markdown renderer supports all these features."

support = hỗ trợ tính năng

---

Câu của cậu:

> "viết lại toàn bộ cú pháp markdown ở trên để tôi copy vào môi trường của tôi xem nó có render đúng không"

Nói tự nhiên hơn:

✅
"Can you rewrite all the markdown syntax so I can copy it and test whether my renderer works correctly?"

hoặc ngắn hơn:

✅
"Can you give me a full markdown test file so I can check my renderer?"


Được, đây là **một bảng Markdown cố tình làm header và content rất dài** để cậu test xem renderer của cậu:

* wrap text
* overflow scroll
* hay phá layout 📦

Cậu copy nguyên đoạn này vào markdown renderer.

---

## Long Header Table Test

| Extremely Long Header Name That Might Cause Layout Overflow Problems In Some Markdown Renderers                                                                                            | Another Very Long Column Header That Keeps Going And Going Without Stopping                                                                                                       | Short |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| This is a very very very long text inside a table cell that might wrap across multiple lines depending on how the CSS of the markdown renderer is configured                               | Another extremely long piece of content that could potentially break the layout if the table does not support proper word wrapping or overflow handling                           | ok    |
| Short text                                                                                                                                                                                 | This column contains a long description explaining something in detail to test how the markdown renderer deals with content that exceeds the typical width of the table container | ok    |
| This cell contains a paragraph-sized text to test whether the table will stretch the page width or keep the layout constrained inside the markdown container which is usually around 700px | short                                                                                                                                                                             | ok    |

---

## Ultra Wide Table Test

| Column With A Ridiculously Long Name Designed To Break Layout                             | Another Column With Even Longer Header Text That Might Cause Horizontal Scrolling In Some Markdown Implementations | Yet Another Column With A Long Header | Final Column |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------- | ------------ |
| long long long long long long long long long long long long long long long long long long | more long long long long long long long long long long long text                                                   | medium                                | ok           |
| medium text                                                                               | medium text                                                                                                        | medium text                           | ok           |
| short                                                                                     | short                                                                                                              | short                                 | ok           |

---

## Single Column Stress Test

| Extremely Long Header That Probably Should Wrap But Sometimes Does Not In Basic Markdown CSS                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| This is a very long paragraph placed inside a single table cell to test whether the renderer will wrap the text, overflow the container, or break the layout completely depending on the CSS rules applied to the table element. |

---

💡 Khi test xong cậu nên chú ý 3 behavior:

1️⃣ **wrap text**

```
word-break: break-word
```

2️⃣ **horizontal scroll**

```
overflow-x: auto
```

3️⃣ **layout break**

table kéo rộng cả page.

---

🏠 Scenario trong nhà:

"I'm testing how the table handles overflow."

overflow = tràn layout

---

Câu của cậu:

> "tạo một bảng mà có header hoặc content dài xem nó xử lý tràn như nào"

Nói tự nhiên hơn:

✅
"Can you create a table with very long headers and content so I can test how overflow is handled?"

hoặc

✅
"I want to see how my markdown renderer handles table overflow."

---

Nếu cậu muốn, tớ có thể cho cậu thêm **5 test markdown cực khó** mà nhiều markdown renderer:

* vỡ layout
* parse sai
* hoặc crash luôn 😆

Dev thường dùng mấy test này để **stress test markdown engine**.
