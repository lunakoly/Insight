# Insight
A server that allows multiple users to edit and run code simultaneously

![image](https://github.com/lunakoly/Insight/blob/dc4c8ecbfff51f8722581099e421ed68c2f3adda/images/image.png)

## Requirements
- `Node.js` installed

## Installation
```
$ git clone https://github.com/lunakoly/Insight.git
```

## Usage
```
node . [options...]
```

Available options:
- `--help`: prints usage message
- `--port`: sets the port to start the server on
- `--command`: sets the initial value of the `[Run]` command
- `--language`: sets the identifier of the syntax highlight rules to be used initially (terminates if the requested language is not presented)
- `--file`: specifies the file which contents should be used as initial text

Available aliases:
- `h` = `--help`
- `p` = `--port`
- `c` = `--command`
- `l` = `--language`
- `f` = `--file`

When no options/aliases specified the default ones are used:
- The port is `1234`
- The initial command is `print Hello!`
- The initial language is `plain text`
- The initial text will be `Type here...`

For example:
```
$ node . -pc 25565 "echo Bye!" --file ~/welcome.txt
```

## Overriding Defaults
Alternative default options can be specifier in `~/.insight/defaults.json` file. Top-level keys must be exactly the same options as the ones defined above except they should not have `--` prefix:
```
{
	"command": "python code",
	"language": "python",
	"file": "C:\\\\Users\\luna_koly\\.insight\\greeting.py"
}
```

## Accessing Code
When any user requests `[Run]` the text is written into a file named `code` inside of a certain directory references as `runtime`. The command is then executed within the `runtime` as it's current working directory.

## Languages
To add different syntax highlighting schemes the one needs to have a corresponding `.json` file inside of `~/.insight/languages/`. The name of the file (without the extension) is used as a language identifier. The name `plain text.json` is forbidden since such an identifier is already in use.

The structure of the file:
```
{
    /**
     * Name is required and will be displayed
     * in the select control on the client side
     */
	"name": "Python",

	/**
     * Scopes are requred and represent actual syntax
     * highlighting rules to be applied
     */
	"scopes": {
    	/**
         * Keys are the identifiers of context.
         * Values are the contexts themselves.
         * Global scope is required since it's
         * a starting point of the highlight
         */
		"global": {
       		/**
             * Patterns are required and define
             * regex string representations as keys
             * and actions to be done as their mapped
             * values.
             * 'patterns' may be empty.
             */
			"patterns": {
            	/**
                 * In our example it defines a start of
                 * quoted text
                 */
				"'": {
                	/**
                     * Style to apply to the result of
                     * the "'" match.
                     */
					"style_class": "single-quoted",
                    /**
                     * The name of the scope to use
                     * recursively scince now
                     */
					"push": "single_quote_scope"
				},

                /**
                 * An example of matching keywords
                 */
				"\\b(if|elif|else)\\b": {
					"style_class": "keyword"
				}
			}
		},

        /**
         * The quoted text in our example.
         */
        "single_quote_scope": {
        	/**
             * Optional parameter defining the style class
             * for the whole scope
             */
			"style_class": "single-quoted",

			"patterns": {
				"'": {
                	/**
                     * Tells the interpreter to escape the
                     * current scope
                     */
					"pop": true
				},

				/**
                 * Match escape sequences
                 */
				"\\\\.": {
					"style_class": "keyword"
				}
			}
		}
	}
}
```