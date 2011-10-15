Report Templates
================
Although users may add and remove fields as they wish, all "standard" fields should be defined in a template. These are the fields the user sees when they first drop a template into their report.

Templates are defined in JSON in `templates.json`, in the root directory of your Philadelphia installation, with the following structure::

    [
        {
            "_id": "template_name",
            "type": "template",
            "default": boolean,
            "fields": [
                {
                    "name": "field 1 name",
                    "type": "field 1 type",
                    "attrib": "field 1 attributes",
                    "required": boolean
                },
                {
                    "name": "field 2 name",
                    "type": "field 2 type",
                    "attrib": "field 2 attributes",
                    "required": boolean
                }
            ]
        }
    ]

After modifying `templates.json`, you must push the changes to the server with `./egret pushdata` as shown in the installation guide.

Field Types
-----------
The value of `"type"` must be an HTML form input type. Currently, Philadelphia supports `text`, `textarea`, and `checkbox`.

Field Attributes
----------------
Attributes are optional, and any provided will be passed along directly to the HTML input element. This is useful, for example, in fixing the size of a `textarea`::

    {
        "name": "terminal contents",
        "type": "textarea",
        "attrib": "rows=80 cols=25"
    }

Default Templates
-----------------
If a template has the optional key `"default"` set to `true`, an instance of the template is automatically placed at the top of new shift reports

Required Fields
---------------
Fields with the optional key `"required"` set to `true` cannot be deleted from the template. They also appear red if null.

