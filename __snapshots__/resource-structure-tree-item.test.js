exports['ResourceStructureTreeItem should return correct children 1'] = [
  {
    "label": "Imports",
    "collapsibleState": 1,
    "resource": {
      "filePath": "./path",
      "rootPath": "/root",
      "start": 0,
      "end": 100,
      "imports": [
        {
          "libraryName": "str-imp"
        }
      ],
      "exports": [],
      "declarations": [
        {
          "name": "var",
          "isConst": false,
          "isExported": false
        }
      ],
      "resources": [
        {
          "name": "namespace",
          "start": 10,
          "end": 20,
          "imports": [],
          "exports": [],
          "declarations": [],
          "resources": [],
          "usages": []
        }
      ],
      "usages": []
    },
    "context": {
      "subscriptions": [],
      "extensionPath": "",
      "storagePath": ""
    },
    "iconPath": "./src/assets/icons/declarations/module.svg"
  },
  {
    "label": "namespace",
    "collapsibleState": 1,
    "resource": {
      "name": "namespace",
      "start": 10,
      "end": 20,
      "imports": [],
      "exports": [],
      "declarations": [],
      "resources": [],
      "usages": []
    },
    "context": {
      "subscriptions": [],
      "extensionPath": "",
      "storagePath": ""
    },
    "iconPath": "./src/assets/icons/declarations/module.svg"
  },
  {
    "label": "var",
    "collapsibleState": 0,
    "declaration": {
      "name": "var",
      "isConst": false,
      "isExported": false
    },
    "context": {
      "subscriptions": [],
      "extensionPath": "",
      "storagePath": ""
    },
    "command": {
      "arguments": [
        {
          "name": "var",
          "isConst": false,
          "isExported": false
        }
      ],
      "title": "Jump to node",
      "command": "typescriptHero.codeOutline.gotoNode"
    }
  }
]
