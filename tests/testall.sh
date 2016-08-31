#!/bin/bash
for FILE in *.js; do
	echo ${FILE}
	node ${FILE}
done
