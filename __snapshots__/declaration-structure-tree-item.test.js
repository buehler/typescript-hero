exports['DeclarationStructureTreeItem should return the correct icon path 1'] = `
./src/assets/icons/declarations/class.svg
`

exports['DeclarationStructureTreeItem should return the correct accessor children 1'] = [
  {
    "label": "get() getter",
    "collapsibleState": 0,
    "declaration": {
      "name": "getter",
      "isAbstract": false
    },
    "context": {
      "subscriptions": [],
      "extensionPath": "",
      "storagePath": ""
    },
    "command": {
      "arguments": [
        {
          "name": "getter",
          "isAbstract": false
        }
      ],
      "title": "Jump to node",
      "command": "typescriptHero.codeOutline.gotoNode"
    }
  }
]

exports['DeclarationStructureTreeItem should return the correct property children 1'] = [
  {
    "label": "property",
    "collapsibleState": 0,
    "declaration": {
      "name": "property"
    },
    "context": {
      "subscriptions": [],
      "extensionPath": "",
      "storagePath": ""
    },
    "command": {
      "arguments": [
        {
          "name": "property"
        }
      ],
      "title": "Jump to node",
      "command": "typescriptHero.codeOutline.gotoNode"
    }
  }
]

exports['DeclarationStructureTreeItem should return the correct method children 1'] = [
  {
    "label": "method()",
    "collapsibleState": 0,
    "declaration": {
      "name": "method",
      "isAbstract": false,
      "parameters": [],
      "variables": []
    },
    "context": {
      "subscriptions": [],
      "extensionPath": "",
      "storagePath": ""
    },
    "command": {
      "arguments": [
        {
          "name": "method",
          "isAbstract": false,
          "parameters": [],
          "variables": []
        }
      ],
      "title": "Jump to node",
      "command": "typescriptHero.codeOutline.gotoNode"
    }
  }
]

exports['DeclarationStructureTreeItem should not return children on simple declarations 1'] = []
