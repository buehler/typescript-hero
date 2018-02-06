exports['ImportsStructureTreeItem should return the children for the imports 1'] = [
  {
    "label": "lib",
    "collapsibleState": 1,
    "tsImport": {
      "libraryName": "lib",
      "start": 0,
      "end": 1,
      "specifiers": []
    },
    "context": {
      "subscriptions": [],
      "extensionPath": "",
      "storagePath": ""
    },
    "iconPath": "./src/assets/icons/declarations/import.svg",
    "command": {
      "arguments": [
        {
          "libraryName": "lib",
          "start": 0,
          "end": 1,
          "specifiers": []
        }
      ],
      "title": "Jump to node",
      "command": "typescriptHero.codeOutline.gotoNode"
    }
  }
]

exports['ImportStructureTreeItem should return the correct children for the imports testFn 1'] = {
  "name": "testFn",
  "behavior": [
    {
      "given": {
        "libraryName": "named-imp",
        "start": 0,
        "end": 1,
        "specifiers": []
      },
      "expect": []
    },
    {
      "given": {
        "libraryName": "str-imp"
      },
      "expect": []
    },
    {
      "given": {
        "libraryName": "ext-imp",
        "alias": "extImp",
        "start": 0,
        "end": 1
      },
      "expect": [
        {
          "label": "extImp",
          "collapsibleState": 0,
          "iconPath": "./src/assets/icons/declarations/default.svg",
          "command": {
            "arguments": [
              {
                "libraryName": "ext-imp",
                "alias": "extImp",
                "start": 0,
                "end": 1
              }
            ],
            "title": "Jump to node",
            "command": "typescriptHero.codeOutline.gotoNode"
          }
        }
      ]
    },
    {
      "given": {
        "libraryName": "namespace-imp",
        "alias": "namespace",
        "start": 0,
        "end": 1
      },
      "expect": [
        {
          "label": "namespace",
          "collapsibleState": 0,
          "iconPath": "./src/assets/icons/declarations/default.svg",
          "command": {
            "arguments": [
              {
                "libraryName": "namespace-imp",
                "alias": "namespace",
                "start": 0,
                "end": 1
              }
            ],
            "title": "Jump to node",
            "command": "typescriptHero.codeOutline.gotoNode"
          }
        }
      ]
    },
    {
      "given": {
        "libraryName": "named-spec-imp",
        "start": 0,
        "end": 1,
        "specifiers": [
          {
            "specifier": "spec"
          }
        ],
        "defaultAlias": "default"
      },
      "expect": [
        {
          "label": "(default) default",
          "collapsibleState": 0,
          "iconPath": "./src/assets/icons/declarations/default.svg",
          "command": {
            "arguments": [
              {
                "libraryName": "named-spec-imp",
                "start": 0,
                "end": 1,
                "specifiers": [
                  {
                    "specifier": "spec"
                  }
                ],
                "defaultAlias": "default"
              }
            ],
            "title": "Jump to node",
            "command": "typescriptHero.codeOutline.gotoNode"
          }
        },
        {
          "label": "spec",
          "collapsibleState": 0,
          "iconPath": "./src/assets/icons/declarations/default.svg",
          "command": {
            "arguments": [
              {
                "libraryName": "named-spec-imp",
                "start": 0,
                "end": 1,
                "specifiers": [
                  {
                    "specifier": "spec"
                  }
                ],
                "defaultAlias": "default"
              }
            ],
            "title": "Jump to node",
            "command": "typescriptHero.codeOutline.gotoNode"
          }
        }
      ]
    }
  ]
}
