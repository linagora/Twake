---
description: Create a table
---

# Table

#### Usage

```jsx
import Table from 'components/Table/Table.js';
```

```jsx
<Table /> 
```

#### 

#### Props

| **name** | **Description** | **Type** | **Default** |
| :--- | :--- | :--- | :--- |
| **columns** |  | ReactNode | null |
| **onAdd** | If defined a add button appear and clicking on it call this callback. | Function | null |
| **addText** | Button content | ReactNode | null |
| **onSearch** | Called when search bar is changed. Return a Promise that resolve with a list of users. Argument is \(query: string, maxResult: number\)=&gt;{return new Promise\(...\)} | Function | null |
| **onRequestNextPage, onRequestPreviousPage** | \(token: string, maxResult: number\)=&gt;{return new Promise\(...\)} | Function | null |
| **rowKey** | \(row\)=&gt;return row.id | Function | null |

**Functions \(callable on the component from parent\)**

| **name** | **Description** | **Type** |
| :--- | :--- | :--- |
| **newElements\(elements\)** | Add new rows at the beginning of the table. | Function |

**Internal implementation**

* If no data in table, set loading to true, call onRequestNextPage without offset token.
* If next page button is clicked, get last row token, set Table to loading, and requestNextPage.
* When recieve result in requestNextPage, set loading to false and update data.
* Table must memorize already loaded pages to be faster
* Table must detect when request a page and no result is returned in this case disable corresponding button.

